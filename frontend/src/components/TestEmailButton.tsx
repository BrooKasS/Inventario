import { useState } from 'react';

export function TestEmailButton() {
  const [correo, setCorreo] = useState('p_scorrea@fiduprevisora.com.co');
  const [nombreActivo, setNombreActivo] = useState('TEST');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const testEmail = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/assets/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo,
          nombreActivo,
          linkFirma: `http://localhost:5173/firmar/test-${Date.now()}`,
        }),
      });

      const data = await res.json();
      setResultado(data);
      
      if (data.success) {
        alert('✅ Email enviado exitosamente');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error: any) {
      setResultado({ success: false, error: error.message });
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', maxWidth: '400px' }}>
      <h3>🧪 Testear Email</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label>Correo:</label>
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Nombre Activo:</label>
        <input
          type="text"
          value={nombreActivo}
          onChange={(e) => setNombreActivo(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>

      <button
        onClick={testEmail}
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'default' : 'pointer',
        }}
      >
        {loading ? 'Enviando...' : 'Enviar Email de Prueba'}
      </button>

      {resultado && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: resultado.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${resultado.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: resultado.success ? '#155724' : '#721c24',
        }}>
          <pre style={{ margin: '0', fontSize: '12px' }}>
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
