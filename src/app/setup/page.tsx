'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const setupClient = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/setup/create-client', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const syncInstagram = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/instagram/sync', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Setup Dashboard</h1>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Crear Cliente</CardTitle>
            <CardDescription>
              Registra tu cuenta de Instagram en la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={setupClient} disabled={loading}>
              {loading ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Sincronizar Instagram</CardTitle>
            <CardDescription>
              Obtén posts y estadísticas de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={syncInstagram} disabled={loading}>
              {loading ? 'Sincronizando...' : 'Sincronizar Instagram'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
