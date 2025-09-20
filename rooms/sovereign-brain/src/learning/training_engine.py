"""
EXPREZZZO Training Engine
Trains on your data, learns from mistakes, improves over time
"""

import os
import json
import torch
import asyncio
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import pandas as pd
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, TaskType
from datasets import Dataset
import asyncpg
from src.memory.sovereign_memory import SovereignMemorySystem

class TrainingEngine:
    """
    Fine-tunes and adapts the model to your specific needs
    """
    
    def __init__(self):
        self.memory_system = SovereignMemorySystem()
        self.model = None
        self.tokenizer = None
        self.training_data = []
        self.feedback_data = []
        self.model_path = "./models/finetuned"
        self.checkpoint_path = "./models/checkpoints"
        
    async def initialize(self):
        """Initialize the training system"""
        await self.memory_system.initialize()
        
        # Create directories
        Path(self.model_path).mkdir(parents=True, exist_ok=True)
        Path(self.checkpoint_path).mkdir(parents=True, exist_ok=True)
        
        print("✅ Training Engine initialized")
    
    def load_base_model(self, model_name: str = "meta-llama/Llama-2-7b-hf"):
        """Load the base model for fine-tuning"""
        
        print(f"Loading base model: {model_name}")
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Load with 8-bit quantization for efficiency
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            load_in_8bit=True,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        
        # Configure LoRA for efficient fine-tuning
        lora_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["q_proj", "v_proj"],
            lora_dropout=0.1,
            bias="none",
            task_type=TaskType.CAUSAL_LM
        )
        
        self.model = get_peft_model(self.model, lora_config)
        
        print("✅ Model loaded with LoRA adapters")
    
    async def collect_training_data(self,
                                  sources: List[str] = None,
                                  min_score: float = 0.0) -> List[Dict]:
        """Collect training data from memories"""
        
        async with self.memory_system.db_pool.acquire() as conn:
            query = """
                SELECT content, metadata, source, feedback_score, corrections
                FROM memories
                WHERE feedback_score >= $1
            """
            
            params = [min_score]
            
            if sources:
                query += " AND source = ANY($2)"
                params.append(sources)
            
            query += " ORDER BY feedback_score DESC, access_count DESC"
            
            results = await conn.fetch(query, *params)
        
        training_data = []
        
        for row in results:
            # Create training example
            content = row['content']
            
            # If there are corrections, use the corrected version
            if row['corrections']:
                for correction in row['corrections']:
                    if 'corrected_content' in correction:
                        # Create a learning pair
                        training_data.append({
                            'input': content,
                            'output': correction['corrected_content'],
                            'type': 'correction',
                            'score': row['feedback_score']
                        })
            
            # Regular content for general training
            training_data.append({
                'input': "",  # Will be filled by context
                'output': content,
                'type': 'knowledge',
                'source': row['source'],
                'score': row['feedback_score']
            })
        
        self.training_data = training_data
        print(f"✅ Collected {len(training_data)} training examples")
        
        return training_data
    
    async def learn_from_mistakes(self):
        """Learn from feedback and corrections"""
        
        async with self.memory_system.db_pool.acquire() as conn:
            # Get all negative feedback
            negative_feedback = await conn.fetch("""
                SELECT m.content, f.feedback_value, m.corrections
                FROM learning_feedback f
                JOIN memories m ON f.memory_id = m.id
                WHERE f.feedback_type IN ('correction', 'negative')
                ORDER BY f.timestamp DESC
                LIMIT 1000
            """)
        
        learning_pairs = []
        
        for feedback in negative_feedback:
            original = feedback['content']
            feedback_value = json.loads(feedback['feedback_value'])
            
            if 'corrected_content' in feedback_value:
                # Learn what not to do and what to do instead
                learning_pairs.append({
                    'avoid': original,
                    'prefer': feedback_value['corrected_content'],
                    'reason': feedback_value.get('reason', 'User correction')
                })
        
        # Store learning pairs for training
        self.feedback_data = learning_pairs
        
        print(f"✅ Learned from {len(learning_pairs)} mistakes")
        
        return learning_pairs
    
    def prepare_dataset(self) -> Dataset:
        """Prepare dataset for training"""
        
        # Combine training data and feedback data
        all_data = []
        
        # Add knowledge data
        for item in self.training_data:
            if item['type'] == 'knowledge':
                text = f"### Knowledge: {item['output']}"
            else:
                text = f"### Input: {item['input']}\n### Output: {item['output']}"
            
            all_data.append({'text': text})
        
        # Add feedback learning
        for item in self.feedback_data:
            text = f"### Incorrect: {item['avoid']}\n### Correct: {item['prefer']}\n### Reason: {item['reason']}"
            all_data.append({'text': text})
        
        # Create dataset
        dataset = Dataset.from_list(all_data)
        
        # Tokenize
        def tokenize_function(examples):
            return self.tokenizer(
                examples['text'],
                truncation=True,
                padding='max_length',
                max_length=512
            )
        
        tokenized_dataset = dataset.map(tokenize_function, batched=True)
        
        return tokenized_dataset
    
    async def train(self,
                   epochs: int = 3,
                   batch_size: int = 4,
                   learning_rate: float = 2e-5):
        """Train the model on collected data"""
        
        if not self.model:
            raise ValueError("Model not loaded. Call load_base_model() first.")
        
        # Collect latest training data
        await self.collect_training_data()
        await self.learn_from_mistakes()
        
        # Prepare dataset
        dataset = self.prepare_dataset()
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=self.checkpoint_path,
            num_train_epochs=epochs,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            warmup_steps=100,
            weight_decay=0.01,
            logging_dir='./logs',
            logging_steps=10,
            save_strategy="epoch",
            evaluation_strategy="no",
            save_total_limit=3,
            learning_rate=learning_rate,
            fp16=True,
            push_to_hub=False,
        )
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,
        )
        
        # Create trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            data_collator=data_collator,
            train_dataset=dataset,
        )
        
        print("🚀 Starting training...")
        
        # Train
        trainer.train()
        
        # Save the fine-tuned model
        trainer.save_model(self.model_path)
        self.tokenizer.save_pretrained(self.model_path)
        
        print(f"✅ Training complete! Model saved to {self.model_path}")
        
        # Update memory system with training results
        await self.memory_system.store_memory(
            content=f"Training completed: {epochs} epochs, {len(dataset)} examples",
            source="training_engine",
            metadata={
                'epochs': epochs,
                'examples': len(dataset),
                'timestamp': datetime.now().isoformat(),
                'model_path': self.model_path
            }
        )
    
    async def continuous_learning_loop(self):
        """Continuous learning from user interactions"""
        
        while True:
            try:
                print("🔄 Running continuous learning cycle...")
                
                # Consolidate memories
                await self.memory_system.consolidate_learning()
                
                # Check if we have enough new feedback
                async with self.memory_system.db_pool.acquire() as conn:
                    recent_feedback = await conn.fetchval("""
                        SELECT COUNT(*)
                        FROM learning_feedback
                        WHERE timestamp > NOW() - INTERVAL '24 hours'
                    """)
                
                if recent_feedback > 10:
                    print(f"📚 Found {recent_feedback} new feedback items")
                    
                    # Trigger retraining
                    await self.train(epochs=1, batch_size=2)
                
                # Wait before next cycle
                await asyncio.sleep(3600)  # Check every hour
                
            except Exception as e:
                print(f"❌ Error in learning loop: {e}")
                await asyncio.sleep(60)

# Initialize the training engine
training_engine = TrainingEngine()
