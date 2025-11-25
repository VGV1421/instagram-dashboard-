'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Link, Check, AlertCircle, Send } from 'lucide-react';

export default function DocumentosPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Configuración actual de documentos
  const documents = [
    {
      keyword: 'INFO',
      title: 'Información General',
      type: 'info',
      url: 'https://vgv1421.github.io/instagram-dashboard-/INFO.pdf',
      message: 'Información sobre nuestra academia'
    },
    {
      keyword: 'IA',
      title: 'Herramientas IA',
      type: 'guide',
      url: 'https://vgv1421.github.io/instagram-dashboard-/HERRAMIENTAS-IA.pdf',
      message: 'Guía de herramientas de IA gratuitas'
    },
    {
      keyword: 'MARKETING',
      title: 'Marketing Digital',
      type: 'guide',
      url: 'https://vgv1421.github.io/instagram-dashboard-/MARKETING-DIGITAL.pdf',
      message: 'Guía completa de marketing digital'
    },
    {
      keyword: 'GUIA',
      title: 'Guía Completa',
      type: 'guide',
      url: 'https://vgv1421.github.io/instagram-dashboard-/GUIA-COMPLETA.pdf',
      message: 'Guía para empezar tu negocio digital'
    },
    {
      keyword: 'CURSO',
      title: 'Info del Curso',
      type: 'course',
      url: 'https://vgv1421.github.io/instagram-dashboard-/INFO-CURSO.pdf',
      message: 'Información completa del curso'
    }
  ];

  const testDM = async (keyword: string) => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/instagram/send-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: 'test_user_id', // Reemplazar con ID real para test
          message: `Test de envío de documento: ${keyword}`,
          documentUrl: documents.find(d => d.keyword === keyword)?.url,
          documentType: documents.find(d => d.keyword === keyword)?.type
        })
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      setTestResult({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Documentos</h1>
        <p className="text-muted-foreground">
          Configura los documentos que se enviarán automáticamente cuando alguien comente con una palabra clave
        </p>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="upload">Subir Archivos</TabsTrigger>
          <TabsTrigger value="test">Probar Envío</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Configurados</CardTitle>
              <CardDescription>
                Estos documentos se envían automáticamente cuando alguien comenta con la palabra clave
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.keyword} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{doc.title}</h3>
                        <Badge variant="secondary">{doc.keyword}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{doc.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Link className="h-4 w-4" />
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline truncate"
                    >
                      {doc.url}
                    </a>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testDM(doc.keyword)}
                      disabled={testing}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Probar Envío
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subir tus Documentos</CardTitle>
              <CardDescription>
                Opciones para alojar tus documentos gratuitamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    Opción 1: Google Drive (Recomendado)
                  </h3>
                  <ol className="text-sm space-y-2 ml-7 list-decimal text-muted-foreground">
                    <li>Sube tu PDF a Google Drive</li>
                    <li>Click derecho → Compartir → Obtener enlace</li>
                    <li>Cambiar a "Cualquiera con el enlace"</li>
                    <li>Copiar enlace y usarlo en la configuración</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    Opción 2: Dropbox
                  </h3>
                  <ol className="text-sm space-y-2 ml-7 list-decimal text-muted-foreground">
                    <li>Sube tu archivo a Dropbox</li>
                    <li>Click en Compartir → Crear enlace</li>
                    <li>Cambiar "?dl=0" por "?dl=1" en el enlace</li>
                    <li>Usar ese enlace en la configuración</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    Opción 3: GitHub Pages
                  </h3>
                  <ol className="text-sm space-y-2 ml-7 list-decimal text-muted-foreground">
                    <li>Sube tus PDFs al repositorio gh-pages</li>
                    <li>Accesibles en: vgv1421.github.io/instagram-dashboard-/NOMBRE.pdf</li>
                    <li>Completamente gratis y sin límites</li>
                  </ol>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 mb-1">
                      Editar configuración
                    </p>
                    <p className="text-blue-700">
                      Para cambiar las URLs de los documentos, edita el archivo:
                      <code className="bg-blue-100 px-2 py-1 rounded ml-1">
                        src/lib/instagram/document-config.ts
                      </code>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Probar Envío de DM</CardTitle>
              <CardDescription>
                Prueba el envío de mensajes antes de activarlo en producción
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-900 mb-1">
                      Requisitos para enviar DMs
                    </p>
                    <ul className="text-yellow-700 space-y-1 list-disc ml-4">
                      <li>Cuenta de Instagram Business o Creator</li>
                      <li>Permiso <code>instagram_manage_messages</code></li>
                      <li>App aprobada por Meta (App Review)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {testResult && (
                <Card className={testResult.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                  <CardContent className="pt-6">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold">¿Cómo funciona?</h3>
                <ol className="text-sm space-y-2 ml-4 list-decimal text-muted-foreground">
                  <li>Usuario comenta en tu post con palabra clave (ej: "INFO")</li>
                  <li>Instagram envía webhook a tu servidor</li>
                  <li>Tu servidor detecta la palabra clave</li>
                  <li>Envía automáticamente el DM con el documento</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
