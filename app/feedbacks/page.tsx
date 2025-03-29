'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { use } from 'react'

type Feedback = {
  id: string
  candidate_name: string
  interview_date: string
  score_structure: number
  score_listening: number
  score_depth: number
  created_at: string
  users?: {
    id: string
    name: string
  }
}

export default function FeedbacksPage() {
  const [data, setData] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // 平均スコアを計算
  const getAverageScore = (fb: Feedback) => {
    return ((fb.score_structure + fb.score_listening + fb.score_depth) / 3).toFixed(1)
  }

  // スコアに基づいた背景色を取得
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-emerald-100 text-emerald-800'
    if (score >= 3) return 'bg-blue-100 text-blue-800'
    if (score >= 2) return 'bg-amber-100 text-amber-800'
    return 'bg-red-100 text-red-800'
  }

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
      .from('interview_feedbacks')
      .select(`
        id,
        candidate_name,
        interview_date,
        score_structure,
        score_listening,
        score_depth,
        created_at,
        users (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
  
      const { data, error } = await query

      if (error) {
        console.error('取得エラー:', error)
      } else {
        // users が配列で返ってきた場合に備えて変換
        const fixedData = (data as any[]).map((item) => ({
          ...item,
          users: Array.isArray(item.users) ? item.users[0] : item.users
        }))
      
        setData(fixedData as Feedback[])
      }
      setLoading(false)
    }
  
    fetchData()
  }, [])

  // 検索フィルター
  const filteredData = data.filter(fb => 
    fb.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fb.users?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">フィードバック一覧</h1>
            <p className="text-gray-500">面接候補者のフィードバックデータを管理・閲覧できます</p>
          </div>
          <Link 
            href="/submit" 
            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
          >
            新規フィードバック登録
          </Link>
        </div>

        {/* フィルター＆コントロール */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 gap-4">
            {/* 検索ボックス */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              <input
                type="text"
                placeholder="候補者名または面接官で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-gray-600 pl-10 w-full border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 結果カウンター */}
        <div className="mb-4 text-sm text-gray-500">
          全{filteredData.length}件の結果
        </div>

        {/* データテーブル */}
        <div className="bg-white overflow-hidden shadow-sm rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    候補者
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    面接日
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    面接官
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    スコア
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日時
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      該当するデータがありません
                    </td>
                  </tr>
                ) : (
                  filteredData.map((fb) => {
                    const avgScore = getAverageScore(fb);
                    const scoreColorClass = getScoreColor(Number(avgScore));
                    
                    return (
                      <tr key={fb.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/feedbacks/${fb.id}`} 
                            className="group flex items-center"
                          >
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                              {fb.candidate_name.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {fb.candidate_name || '-'}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {fb.id.substring(0, 8)}...
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-2">📅</span>
                            <span className="text-sm text-gray-900">{fb.interview_date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-2">👤</span>
                            <span className="text-sm text-gray-900">
                              {fb.users?.name || '（未設定）'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-center">
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${scoreColorClass}`}>
                              平均: {avgScore}
                            </span>
                            <div className="flex items-center mt-2 space-x-2">
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-gray-500">構成</span>
                                <span className="text-sm font-medium">{fb.score_structure}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-gray-500">傾聴</span>
                                <span className="text-sm font-medium">{fb.score_listening}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-gray-500">深掘り</span>
                                <span className="text-sm font-medium">{fb.score_depth}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center justify-center">
                            <span className="text-gray-400 mr-2">🕒</span>
                            <span>{new Date(fb.created_at).toLocaleString()}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}