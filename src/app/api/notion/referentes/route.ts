import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function GET() {
  try {
    if (!process.env.NOTION_REFERENTES_PAGE_ID) {
      return NextResponse.json({
        success: false,
        error: 'Notion Referentes page ID not configured',
        demo: true,
        data: getDemoReferentes(),
      });
    }

    const response = await notion.databases.query({
      database_id: process.env.NOTION_REFERENTES_PAGE_ID,
    });

    const referentes = response.results.map((page: any) => {
      const props = page.properties;

      return {
        id: page.id,
        name: props.Name?.title?.[0]?.plain_text || 'Sin nombre',
        username: props.Username?.rich_text?.[0]?.plain_text || '',
        platform: props.Platform?.select?.name || 'Instagram',
        followers: props.Followers?.number || null,
        niche: props.Niche?.select?.name || '',
        description: props.Description?.rich_text?.[0]?.plain_text || '',
        whyReference: props['Why Reference']?.rich_text?.[0]?.plain_text || '',
        contentStyle: props['Content Style']?.multi_select?.map((item: any) => item.name) || [],
        profileUrl: props['Profile URL']?.url || null,
        avatar: props.Avatar?.files?.[0]?.file?.url || props.Avatar?.files?.[0]?.external?.url || null,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
      };
    });

    return NextResponse.json({
      success: true,
      data: referentes,
      demo: false,
    });
  } catch (error: any) {
    console.error('Error fetching referentes from Notion:', error);

    return NextResponse.json({
      success: true,
      error: error.message,
      demo: true,
      data: getDemoReferentes(),
    });
  }
}

function getDemoReferentes() {
  return [
    {
      id: '1',
      name: 'Gary Vaynerchuk',
      username: '@garyvee',
      platform: 'Instagram',
      followers: 10500000,
      niche: 'Marketing Digital',
      description: 'Empresario, inversor y experto en redes sociales. Creador de contenido motivacional y de negocios.',
      whyReference: 'Excelente en crear contenido corto y directo. Engagement alto con su audiencia. Mezcla motivación con educación.',
      contentStyle: ['Motivacional', 'Educativo', 'Auténtico', 'Directo'],
      profileUrl: 'https://instagram.com/garyvee',
      avatar: null,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Mari Smith',
      username: '@marismith',
      platform: 'Instagram',
      followers: 156000,
      niche: 'Social Media Marketing',
      description: 'The Queen of Facebook. Experta en estrategias de redes sociales y marketing digital.',
      whyReference: 'Contenido educativo de alta calidad. Usa carruseles efectivamente. Balance perfecto entre tips y storytelling.',
      contentStyle: ['Educativo', 'Profesional', 'Visual', 'Estratégico'],
      profileUrl: 'https://instagram.com/marismith',
      avatar: null,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Neil Patel',
      username: '@neilpatel',
      platform: 'Instagram',
      followers: 450000,
      niche: 'SEO y Marketing',
      description: 'Experto en SEO y marketing digital. Co-fundador de varias empresas de marketing.',
      whyReference: 'Simplifica conceptos complejos. Usa datos y estadísticas. Formato consistente y reconocible.',
      contentStyle: ['Datos', 'Educativo', 'Consistente', 'Práctico'],
      profileUrl: 'https://instagram.com/neilpatel',
      avatar: null,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Vilma Núñez',
      username: '@vilmanunez',
      platform: 'Instagram',
      followers: 285000,
      niche: 'Marketing Digital en Español',
      description: 'Referente en marketing digital en español. Fundadora de Convierte Más.',
      whyReference: 'Contenido en español de calidad. Mezcla educación con entretenimiento. Engagement alto con su comunidad.',
      contentStyle: ['Educativo', 'Entretenido', 'Cercano', 'Profesional'],
      profileUrl: 'https://instagram.com/vilmanunez',
      avatar: null,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
    },
  ];
}
