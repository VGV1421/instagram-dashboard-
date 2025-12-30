export interface KieTaskResult {
  success: boolean;
  taskId?: string;
  videoUrl?: string;
  error?: string;
}

/**
 * Crea una tarea de generación de video en Kie.ai
 */
export async function createKieTask(
  providerId: string,
  inputs: any,
  apiKey: string
): Promise<KieTaskResult> {
  try {
    const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: providerId,
        input: inputs
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Kie.ai API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    const taskId = data.data?.taskId || data.taskId || data.task_id || data.id;

    if (!taskId) {
      return { success: false, error: `No taskId in response: ${JSON.stringify(data)}` };
    }

    return { success: true, taskId };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Espera a que se complete la generación del video con polling
 */
export async function waitForKieVideo(
  taskId: string,
  apiKey: string,
  maxAttempts: number = 120
): Promise<KieTaskResult> {
  let status = 'processing';
  let attempts = 0;

  while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const statusResponse = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      if (statusResponse.ok) {
        const responseData = await statusResponse.json();
        const data = responseData.data || responseData;
        status = data.state || data.status;

        if (attempts === 0) {
          console.log('🔍 Primera respuesta polling:', JSON.stringify(responseData));
        }

        console.log(`Status: ${status} (${attempts + 1}/${maxAttempts})`);

        if (status === 'success' || status === 'completed' || status === 'SUCCESS' || status === 'COMPLETED') {
          const videoUrl = data.resultJson?.videoUrl ||
                          data.resultJson?.video_url ||
                          data.resultJson?.result ||
                          data.output?.videoUrl ||
                          data.output?.video_url ||
                          data.videoUrl ||
                          data.video_url ||
                          data.result_url ||
                          data.resultUrl;

          if (videoUrl) {
            return { success: true, videoUrl };
          }
        } else if (status === 'fail' || status === 'failed' || status === 'error' || status === 'FAIL' || status === 'FAILED' || status === 'ERROR') {
          const errorMsg = data.failMsg || data.error || 'Unknown error';
          return { success: false, error: `Kie.ai failed: ${errorMsg}` };
        }
      }

      attempts++;

    } catch (error: any) {
      console.error('Polling error:', error);
      attempts++;
    }
  }

  return { success: false, error: 'Timeout waiting for video' };
}
