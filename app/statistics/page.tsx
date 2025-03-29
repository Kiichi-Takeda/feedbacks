'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

type FeedbackWithUser = {
  user_id: string
  score_structure: number
  score_listening: number
  score_depth: number
  users?: {
    id: string
    name: string
  }
}

export default function StatisticsPage() {
  const [chartData, setChartData] = useState<any[]>([])
  const [filterType, setFilterType] = useState<'all' | 'month' | 'week'>('all')
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
      .from('interview_feedbacks')
      .select(`
        user_id,
        score_structure,
        score_listening,
        score_depth,
        users!user_id (
          id,
          name
        )
      `)
    
    if (filterType !== 'all' && filterDate) {
      const today = new Date(filterDate)
      const from = new Date(today)
      const to = new Date(today)
    
      if (filterType === 'month') {
        from.setDate(1)
        to.setMonth(from.getMonth() + 1)
        to.setDate(0)
      } else if (filterType === 'week') {
        const day = from.getDay()
        from.setDate(from.getDate() - day)
        to.setDate(from.getDate() + 6)
      }
    
      query = query
        .gte('interview_date', from.toISOString().split('T')[0])
        .lte('interview_date', to.toISOString().split('T')[0])
    }
    
    const { data, error } = await query    
      if (error || !data) {
        console.error('取得エラー:', error)
        return
      }
    
      // グルーピングして平均計算（ここはそのままでOK）
      const grouped: Record<string, { name: string, total: number[], count: number }> = {}
    
      for (const item of data) {
        const name = item.users?.name ?? '不明'
        if (!grouped[item.user_id]) {
          grouped[item.user_id] = {
            name,
            total: [0, 0, 0],
            count: 0
          }
        }
        grouped[item.user_id].total[0] += item.score_structure
        grouped[item.user_id].total[1] += item.score_listening
        grouped[item.user_id].total[2] += item.score_depth
        grouped[item.user_id].count += 1
      }
    
      const result = Object.values(grouped).map((g) => ({
        name: g.name,
        構成: +(g.total[0] / g.count).toFixed(2),
        傾聴: +(g.total[1] / g.count).toFixed(2),
        深掘り: +(g.total[2] / g.count).toFixed(2)
      }))
    
      setChartData(result)
    }
    fetchData()
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
    <div className="flex items-center gap-4 mb-4">
  <label className="font-medium">期間で絞り込み：</label>
  <select
    className="border p-1 rounded"
    value={filterType}
    onChange={(e) => setFilterType(e.target.value as 'all' | 'month' | 'week')}
  >
    <option value="all">すべて</option>
    <option value="month">月別</option>
    <option value="week">週別</option>
  </select>

  {(filterType === 'month' || filterType === 'week') && (
    <input
      type="date"
      value={filterDate}
      onChange={(e) => setFilterDate(e.target.value)}
      className="border p-1 rounded"
    />
  )}
</div>
      <h1 className="text-2xl font-bold mb-6">面接官ごとの平均スコア</h1>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 5]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="構成" fill="#8884d8" />
          <Bar dataKey="傾聴" fill="#82ca9d" />
          <Bar dataKey="深掘り" fill="#ffc658" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}