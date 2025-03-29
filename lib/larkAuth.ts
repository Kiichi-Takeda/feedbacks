// lib/larkAuth.ts
import axios from 'axios'

export async function getLarkAccessToken(appId: string, appSecret: string): Promise<string> {
  const response = await axios.post('https://open.larkoffice.com/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: appId,
    app_secret: appSecret,
  })

  if (response.data.code !== 0) {
    console.error('❌ Token取得失敗:', response.data)
    throw new Error('Lark Access Token取得失敗')
  }

  return response.data.tenant_access_token
}