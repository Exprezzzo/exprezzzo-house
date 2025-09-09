"use client";
import { useEffect, useState } from 'react';

interface Metrics {
  requests: { total: number; avgLatency: number };
  costs: { total: number; perRequest: number };
  degraded: { count: number; ratio: number };
  providers: Array<{ name: string; sovereignty_score: number; request_count: number }>;
  sovereignty: { score: number; escapeVelocity: number };
  hourlyBreakdown: Array<{ hour: string; hourly_cost: number; request_count: number }>;
  timestamp: string;
}

export default function AdminRoom() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = autoRefresh ? setInterval(fetchMetrics, 30000) : null;
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh]);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#381819', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#C5B358', fontSize: '24px' }}>⏳ Loading sovereignty metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#381819', minHeight: '100vh', padding: '24px' }}>
        <div style={{ color: '#C72C41', fontSize: '20px' }}>❌ Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#381819', color: '#F5F5DC', minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#C5B358', fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
          🏠 EXPREZZZO Admin Command Center
        </h1>
        <p style={{ color: '#A89F91' }}>
          Sovereignty Score: {metrics ? (metrics.sovereignty.score * 100).toFixed(1) : 0}% | 
          Escape Velocity: {metrics?.sovereignty.escapeVelocity}h | 
          Last Update: {metrics ? new Date(metrics.timestamp).toLocaleTimeString() : 'Never'}
        </p>
        <button 
          onClick={() => setAutoRefresh(!autoRefresh)}
          style={{ 
            marginTop: '8px',
            padding: '8px 16px',
            backgroundColor: autoRefresh ? '#C5B358' : '#A89F91',
            color: '#381819',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#381819', padding: '16px', borderRadius: '8px', border: '1px solid #C5B358' }}>
          <h3 style={{ color: '#C5B358', marginBottom: '8px' }}>📊 Requests</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{metrics?.requests.total.toLocaleString() || 0}</p>
          <p style={{ color: '#A89F91', fontSize: '14px' }}>Avg latency: {metrics?.requests.avgLatency.toFixed(2)}ms</p>
        </div>

        <div style={{ backgroundColor: '#381819', padding: '16px', borderRadius: '8px', border: '1px solid #C5B358' }}>
          <h3 style={{ color: '#C5B358', marginBottom: '8px' }}>💰 Total Cost</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold' }}>${metrics?.costs.total.toFixed(6) || '0.000000'}</p>
          <p style={{ color: '#A89F91', fontSize: '14px' }}>Per request: ${metrics?.costs.perRequest.toFixed(6) || '0.000000'}</p>
        </div>

        <div style={{ backgroundColor: '#381819', padding: '16px', borderRadius: '8px', border: '1px solid #C5B358' }}>
          <h3 style={{ color: '#C5B358', marginBottom: '8px' }}>⚠️ Degraded</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: metrics && metrics.degraded.ratio > 0.1 ? '#C72C41' : '#F5F5DC' }}>
            {metrics ? (metrics.degraded.ratio * 100).toFixed(1) : 0}%
          </p>
          <p style={{ color: '#A89F91', fontSize: '14px' }}>Count: {metrics?.degraded.count || 0}</p>
        </div>

        <div style={{ backgroundColor: '#381819', padding: '16px', borderRadius: '8px', border: '1px solid #C5B358' }}>
          <h3 style={{ color: '#C5B358', marginBottom: '8px' }}>🛡️ Sovereignty</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#C5B358' }}>
            {metrics ? (metrics.sovereignty.score * 100).toFixed(1) : 0}%
          </p>
          <p style={{ color: '#A89F91', fontSize: '14px' }}>Escape: {metrics?.sovereignty.escapeVelocity}h</p>
        </div>
      </div>

      {/* Providers Table */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#C5B358', fontSize: '24px', marginBottom: '16px' }}>🤖 Provider Performance</h2>
        <div style={{ backgroundColor: '#381819', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#381819' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#C5B358' }}>Provider</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#C5B358' }}>Sovereignty</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#C5B358' }}>Requests</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#C5B358' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.providers.map((provider, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid #381819' }}>
                  <td style={{ padding: '12px' }}>{provider.name}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      color: provider.sovereignty_score >= 0.8 ? '#C5B358' : 
                             provider.sovereignty_score >= 0.5 ? '#EDC9AF' : '#C72C41' 
                    }}>
                      {(provider.sovereignty_score * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{provider.request_count}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      backgroundColor: provider.sovereignty_score >= 0.8 ? '#C5B35822' : '#C72C4122',
                      color: provider.sovereignty_score >= 0.8 ? '#C5B358' : '#C72C41'
                    }}>
                      {provider.sovereignty_score >= 0.8 ? 'Sovereign' : 'At Risk'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #C5B358', textAlign: 'center' }}>
        <p style={{ color: '#A89F91' }}>
          🌹 The House Always Wins — Vegas First, Sovereignty Always
        </p>
        <p style={{ color: '#EDC9AF', fontSize: '12px', marginTop: '8px' }}>
          EXPREZZZO House v4.1 | Cost Target: $0.0002 | Forward Only
        </p>
      </div>
    </div>
  );
}
