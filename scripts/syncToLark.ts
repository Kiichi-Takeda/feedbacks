// scripts/syncToLark.ts
import dotenv from 'dotenv'
dotenv.config()

import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { getLarkAccessToken } from '../lib/larkAuth'

// 環境変数
const {
  SUPABASE_URL,
  SUPABASE_KEY,
  LARK_APP_ID,
  LARK_APP_SECRET,
  LARK_BASE_ID,
  LARK_TABLE_ID,
} = process.env

// Supabaseクライアント
const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!)

async function fetchFromSupabase() {
  const { data, error } = await supabase.from('interview_feedbacks').select('*')
  if (error) throw error
  console.log(`✅ Supabase取得件数: ${data.length}`)
  return data
}

async function sendToLark(records: any[], token: string) {
  const url = `https://open.larkoffice.com/open-apis/bitable/v1/apps/${LARK_BASE_ID}/tables/${LARK_TABLE_ID}/records/batch_create`

  const payload = {
    records: records.map((item) => ({
      fields: {
        id: item.id,
        candidate_name: item.candidate_name,
        interview_date: item.interview_date,
        score_structure: item.score_structure,
        score_listening: item.score_listening,
        score_depth: item.score_depth,
        created_at: item.created_at,
        user_name: item.user_name,
      },
    })),
  }

  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (res.data.code !== 0) {
    console.error('❌ Lark送信失敗:', res.data)
    throw new Error('Lark送信失敗')
  }

  console.log('✅ Lark送信完了')
}

async function main() {
  console.log('📦 app_id:', LARK_APP_ID)
  console.log('📦 app_secret:', LARK_APP_SECRET)

  const token = await getLarkAccessToken(LARK_APP_ID!, LARK_APP_SECRET!)
  console.log('🎟️ Lark Access Token:', token)

  const data = await fetchFromSupabase()
  await sendToLark(data, token)
}

main().catch((err) => {
  console.error('❌ エラー:', err)
  process.exit(1)
})