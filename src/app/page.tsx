import { Card } from "@/components/ui/card"

async function getInstagramData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Obtener perfil
    const profileRes = await fetch(`${baseUrl}/api/instagram/profile`, {
      cache: 'no-store'
    })
    const profileData = await profileRes.json()

    // Obtener posts
    const mediaRes = await fetch(`${baseUrl}/api/instagram/media?withInsights=true&limit=10`, {
      cache: 'no-store'
    })
    const mediaData = await mediaRes.json()

    return {
      profile: profileData.data,
      media: mediaData.data,
      source: profileData.source
    }
  } catch (error) {
    console.error('Error fetching Instagram data:', error)
    return null
  }
}

export default async function Home() {
  const data = await getInstagramData()

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6">
          <p className="text-red-600">Error al cargar datos de Instagram</p>
        </Card>
      </div>
    )
  }

  // Calcular métricas agregadas
  const totalReach = data.media.reduce((sum: number, post: any) => sum + (post.insights?.reach || 0), 0)
  const avgReach = data.media.length > 0 ? Math.round(totalReach / data.media.length) : 0

  const totalEngagement = data.media.reduce((sum: number, post: any) =>
    sum + (post.like_count || 0) + (post.comments_count || 0), 0
  )
  const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) : '0'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Bienvenido, @{data.profile.username}
        </h2>
        <p className="text-gray-500 mt-2">
          Vista general de las métricas de tu cuenta de Instagram
        </p>
      </div>

      {/* Grid de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 bg-dashboard-followers border-0">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-600">Seguidores</span>
            <span className="text-3xl font-bold text-gray-900">
              {data.profile.followers_count.toLocaleString()}
            </span>
            <span className="text-xs text-green-600">
              +{data.profile.follows_count.toLocaleString()} siguiendo
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-dashboard-reach border-0">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-600">Alcance Promedio</span>
            <span className="text-3xl font-bold text-gray-900">
              {avgReach.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">
              Últimos {data.media.length} posts
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-dashboard-engagement border-0">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-600">Engagement Rate</span>
            <span className="text-3xl font-bold text-gray-900">{engagementRate}%</span>
            <span className="text-xs text-gray-500">
              {totalEngagement.toLocaleString()} interacciones
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-dashboard-leads border-0">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-600">Leads</span>
            <span className="text-3xl font-bold text-gray-900">-</span>
            <span className="text-xs text-gray-500">Próximamente (ManyChat)</span>
          </div>
        </Card>

        <Card className="p-6 bg-dashboard-sales border-0">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-600">Ventas</span>
            <span className="text-3xl font-bold text-gray-900">-</span>
            <span className="text-xs text-gray-500">Próximamente</span>
          </div>
        </Card>

        <Card className="p-6 bg-dashboard-posts border-0">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-600">Publicaciones</span>
            <span className="text-3xl font-bold text-gray-900">
              {data.profile.media_count}
            </span>
            <span className="text-xs text-gray-500">Total en la cuenta</span>
          </div>
        </Card>
      </div>

      {/* Mensaje informativo */}
      {data.source === 'mock_data' && (
        <Card className="p-6 border-orange-200 bg-orange-50">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-orange-900">Usando datos de demostración</h3>
              <p className="mt-1 text-sm text-orange-700">
                Genera un nuevo token de Instagram desde <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline">Graph API Explorer</a> para ver tus datos reales.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
