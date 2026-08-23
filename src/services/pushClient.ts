function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushNotifications(): Promise<{ success: boolean; message: string }> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, message: 'Web Push não é suportado por este navegador.' };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: 'Permissão de notificação negada pelo usuário.' };
    }

    const res = await fetch('/api/push/vapid-key', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('portal_user_id') || 'user-admin-1'}`
      }
    });
    const data = await res.json();
    if (!data.publicKey) {
      throw new Error('Chave VAPID não encontrada');
    }

    const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    const subRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('portal_user_id') || 'user-admin-1'}`
      },
      body: JSON.stringify(subscription)
    });

    const subData = await subRes.json();
    if (!subRes.ok) {
      throw new Error(subData.error || 'Erro ao registrar subscription no servidor');
    }

    return { success: true, message: 'Notificações Push ativadas com sucesso para novos fretes!' };
  } catch (err: any) {
    console.error('Push subscription error:', err);
    return { success: false, message: err.message || 'Erro ao ativar notificações push.' };
  }
}

export async function testPushNotification(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('portal_user_id') || 'user-admin-1'}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao testar push');
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
