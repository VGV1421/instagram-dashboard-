import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function GET() {
  try {
    if (!process.env.NOTION_BUYER_PERSONAS_PAGE_ID) {
      return NextResponse.json({
        success: false,
        error: 'Notion Buyer Personas page ID not configured',
        demo: true,
        data: getDemoPersonas(),
      });
    }

    const response = await notion.databases.query({
      database_id: process.env.NOTION_BUYER_PERSONAS_PAGE_ID,
    });

    const personas = response.results.map((page: any) => {
      const props = page.properties;

      return {
        id: page.id,
        name: props.Name?.title?.[0]?.plain_text || 'Sin nombre',
        age: props.Age?.number || null,
        occupation: props.Occupation?.rich_text?.[0]?.plain_text || '',
        description: props.Description?.rich_text?.[0]?.plain_text || '',
        goals: props.Goals?.rich_text?.[0]?.plain_text || '',
        painPoints: props['Pain Points']?.rich_text?.[0]?.plain_text || '',
        interests: props.Interests?.multi_select?.map((item: any) => item.name) || [],
        avatar: props.Avatar?.files?.[0]?.file?.url || props.Avatar?.files?.[0]?.external?.url || null,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
      };
    });

    return NextResponse.json({
      success: true,
      data: personas,
      demo: false,
    });
  } catch (error: any) {
    console.error('Error fetching from Notion:', error);

    // Si hay error, devolver datos de demostración
    return NextResponse.json({
      success: true,
      error: error.message,
      demo: true,
      data: getDemoPersonas(),
    });
  }
}

function getDemoPersonas() {
  return [
    {
      id: '1',
      name: 'María Emprendedora',
      age: 32,
      occupation: 'Dueña de negocio digital',
      description: 'Emprendedora en el mundo del marketing digital, busca crecer su presencia en Instagram para atraer más clientes.',
      goals: 'Aumentar engagement, conseguir más leads cualificados, mejorar conversión',
      painPoints: 'Falta de tiempo, no sabe qué contenido funciona mejor, dificultad para medir ROI',
      interests: ['Marketing Digital', 'Redes Sociales', 'Emprendimiento', 'Growth Hacking'],
      avatar: null,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Carlos Coach',
      age: 38,
      occupation: 'Coach de negocios',
      description: 'Coach profesional que usa Instagram para compartir consejos y atraer clientes a sus programas de mentoría.',
      goals: 'Construir autoridad, generar comunidad, vender programas de coaching',
      painPoints: 'Contenido repetitivo, dificultad para destacar, bajo alcance orgánico',
      interests: ['Coaching', 'Desarrollo Personal', 'Liderazgo', 'Productividad'],
      avatar: null,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Ana Influencer',
      age: 26,
      occupation: 'Creadora de contenido',
      description: 'Influencer enfocada en lifestyle y emprendimiento, busca monetizar mejor su audiencia.',
      goals: 'Aumentar seguidores, conseguir colaboraciones, monetizar contenido',
      painPoints: 'Saturación de mercado, algoritmo cambiante, engagement bajo vs seguidores',
      interests: ['Lifestyle', 'Fashion', 'Viajes', 'Emprendimiento'],
      avatar: null,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
    },
  ];
}
