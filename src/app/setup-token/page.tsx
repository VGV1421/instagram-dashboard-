"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2, Copy, ExternalLink } from "lucide-react"

export default function SetupTokenPage() {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [newToken, setNewToken] = useState("")
  const [copied, setCopied] = useState(false)

  const testCurrentToken = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/instagram/profile')
      const data = await response.json()

      setTestResult({
        success: data.source === 'instagram_api',
        source: data.source,
        data: data.data,
        error: data.source === 'mock_data' ? 'Token expirado o inválido' : null
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Error al conectar con la API'
      })
    } finally {
      setTesting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentConfig = {
    appId: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || '777593705310683',
    userId: process.env.NEXT_PUBLIC_INSTAGRAM_USER_ID || '17841475742645634',
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Configurar Token de Instagram
        </h1>
        <p className="text-gray-500 mt-2">
          Sigue estos pasos meticulosamente para obtener un token válido
        </p>
      </div>

      {/* Test actual token */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          1. Probar Token Actual
        </h2>

        <Button
          onClick={testCurrentToken}
          disabled={testing}
          className="mb-4"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Probando...
            </>
          ) : (
            'Probar Token Actual'
          )}
        </Button>

        {testResult && (
          <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">¡Token válido!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-900">Token inválido o expirado</span>
                </>
              )}
            </div>

            {testResult.success ? (
              <div className="text-sm text-green-800">
                <p><strong>Usuario:</strong> @{testResult.data.username}</p>
                <p><strong>Seguidores:</strong> {testResult.data.followers_count?.toLocaleString()}</p>
                <p className="text-green-600 mt-2">✅ Tu token funciona correctamente. No necesitas renovarlo.</p>
              </div>
            ) : (
              <p className="text-sm text-red-800">
                {testResult.error || 'Error desconocido'}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Configuración actual */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          2. Configuración Actual
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">App ID</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                {currentConfig.appId}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentConfig.appId)}
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Instagram User ID</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                {currentConfig.userId}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentConfig.userId)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Pasos para generar token */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          3. Generar Nuevo Token (Paso a Paso)
        </h2>

        <div className="space-y-4">
          <div className="pl-4 border-l-4 border-blue-500">
            <h3 className="font-semibold text-lg mb-2">Paso 1: Abrir Meta for Developers</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Ve a <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1">
                developers.facebook.com/apps <ExternalLink className="h-3 w-3" />
              </a></li>
              <li>Inicia sesión con tu cuenta de Facebook</li>
              <li>Busca tu app <strong>"App ID: {currentConfig.appId}"</strong></li>
              <li>Haz clic en la app para abrirla</li>
            </ol>
          </div>

          <div className="pl-4 border-l-4 border-purple-500">
            <h3 className="font-semibold text-lg mb-2">Paso 2: Configurar Instagram Basic Display</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>En el menú lateral, busca <strong>"Add Product"</strong> (Agregar producto)</li>
              <li>Encuentra <strong>"Instagram Basic Display"</strong> y haz clic en <strong>"Set Up"</strong></li>
              <li>Si ya está configurado, ve a <strong>"Instagram Basic Display" → "Basic Display"</strong></li>
              <li>Baja hasta <strong>"User Token Generator"</strong></li>
            </ol>
          </div>

          <div className="pl-4 border-l-4 border-green-500">
            <h3 className="font-semibold text-lg mb-2">Paso 3: Conectar tu Cuenta de Instagram</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>En <strong>"User Token Generator"</strong>, haz clic en <strong>"Add or Remove Instagram Testers"</strong></li>
              <li>Se abrirá una nueva pestaña con <strong>"Instagram Testers"</strong></li>
              <li>Haz clic en <strong>"Add Instagram Testers"</strong></li>
              <li>Escribe tu usuario de Instagram: <strong>@digitalmindmillonaria</strong></li>
              <li>Haz clic en <strong>"Submit"</strong></li>
              <li><strong>IMPORTANTE:</strong> Ahora ve a Instagram móvil → Configuración → Apps y sitios web → Tester Invites → Acepta la invitación</li>
            </ol>
          </div>

          <div className="pl-4 border-l-4 border-orange-500">
            <h3 className="font-semibold text-lg mb-2">Paso 4: Generar el Token</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Vuelve a <strong>"User Token Generator"</strong> en Meta for Developers</li>
              <li>Haz clic en <strong>"Generate Token"</strong></li>
              <li>Se abrirá una ventana de Instagram</li>
              <li>Inicia sesión con @digitalmindmillonaria</li>
              <li>Autoriza la app para acceder a tu perfil</li>
              <li>Copia el token que aparece (empieza con "IGQW..." o similar)</li>
            </ol>
          </div>

          <div className="pl-4 border-l-4 border-red-500">
            <h3 className="font-semibold text-lg mb-2">Paso 5: Convertir a Token de Larga Duración</h3>
            <p className="text-sm text-gray-700 mb-2">El token generado dura solo 1 hora. Para convertirlo a 60 días:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Abre esta URL en tu navegador (reemplaza los valores):</li>
            </ol>
            <code className="block p-3 bg-gray-900 text-green-400 text-xs rounded mt-2 overflow-x-auto">
              {`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=aa8f1ee30472de16c7b985b9c06552bd&access_token=TU_TOKEN_AQUI`}
            </code>
            <ol start={2} className="list-decimal list-inside space-y-2 text-sm text-gray-700 mt-2">
              <li>Reemplaza <code className="bg-gray-100 px-1 rounded">TU_TOKEN_AQUI</code> con el token que copiaste</li>
              <li>Presiona Enter</li>
              <li>Copia el <code className="bg-gray-100 px-1 rounded">access_token</code> de la respuesta JSON</li>
              <li>Este nuevo token durará 60 días</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Probar nuevo token */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          4. Probar Nuevo Token
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Pega tu nuevo token aquí para probarlo
            </label>
            <Input
              type="text"
              placeholder="IGQW..."
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              className="mt-1 font-mono text-sm"
            />
          </div>

          <Button
            onClick={async () => {
              if (!newToken) {
                alert('Por favor pega tu token primero')
                return
              }

              setTesting(true)
              try {
                const response = await fetch(
                  `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${newToken}`
                )
                const data = await response.json()

                if (data.error) {
                  setTestResult({
                    success: false,
                    error: data.error.message
                  })
                } else {
                  setTestResult({
                    success: true,
                    data: data
                  })
                  alert(`✅ Token válido!\n\nAhora copia este token y pégalo en tu archivo .env.local en la variable:\nINSTAGRAM_ACCESS_TOKEN=${newToken}`)
                }
              } catch (error) {
                setTestResult({
                  success: false,
                  error: 'Error al probar el token'
                })
              } finally {
                setTesting(false)
              }
            }}
            disabled={testing || !newToken}
          >
            {testing ? 'Probando...' : 'Probar Token'}
          </Button>
        </div>
      </Card>

      {/* Ayuda adicional */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <span>⚠️</span>
          Errores Comunes
        </h2>
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <strong className="text-red-600">"Invalid OAuth access token"</strong>
            <p>→ El token está mal copiado o expiró. Genera uno nuevo.</p>
          </div>
          <div>
            <strong className="text-red-600">"Instagram account not connected"</strong>
            <p>→ No aceptaste la invitación de Tester en Instagram. Revisa el Paso 3.</p>
          </div>
          <div>
            <strong className="text-red-600">"Insufficient developer role"</strong>
            <p>→ Necesitas ser Admin de la app de Meta, no solo Developer.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
