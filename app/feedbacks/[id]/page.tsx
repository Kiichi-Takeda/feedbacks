'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts'
import { Award, Clock, User, Calendar, FileText, PieChart as PieChartIcon, Target, ArrowUpCircle } from 'lucide-react'

// Custom color palette
const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'];
const SECTION_COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'];

type InterviewSession = {
  id: string
  candidate_name: string
  interview_date: string
  duration_minutes: number
  overall_score: number
  transcript: string
  interviewers?: {
    id: string
    name: string
  }
  interview_sections?: {
    id: string
    title: string
    start_time: string
    end_time: string
    percentage: number
  }[]
  interview_evaluations?: {
    id: string
    category: string
    score: number
    reason: string
    advice: string
  }[]
  summary?: {
    good: string
    bad: string
    advice: string
  }
}

export default function FeedbackDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<InterviewSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        // メインデータを取得
        const { data: sessionData, error: sessionError } = await supabase
          .from('interview_sessions')
          .select(`
            *,
            interviewers(id, name),
            interview_sections(*),
            interview_evaluations(*)
          `)
          .eq('id', id)
          .single()

        if (sessionError) throw sessionError;
        
        // サマリーデータを取得
        const { data: summaryData, error: summaryError } = await supabase
          .from('summary')
          .select('*')
          .eq('interview_session_id', id)
          .single()
          
        // デバッグ出力
        console.log('取得したセッションデータ:', sessionData);
        console.log('取得したサマリーデータ:', summaryData);

        if (!summaryError) {
          // データを統合
          setData({ 
            ...sessionData, 
            summary: summaryData 
          } as InterviewSession);
        } else {
          console.warn('サマリーデータ取得エラー:', summaryError);
          setData(sessionData as InterviewSession);
        }
      } catch (error) {
        console.error('❌ Supabaseエラー:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">データを読み込み中...</p>
      </div>
    </div>
  )
  
  if (!data) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <div className="text-red-500 text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">データが見つかりません</h2>
        <p className="text-gray-600">指定された面接データは存在しないか、アクセス権限がありません。</p>
      </div>
    </div>
  )

  // Format data for charts
  const sectionData = data.interview_sections?.map((section, index) => ({
    name: section.title,
    value: section.percentage,
    color: SECTION_COLORS[index % SECTION_COLORS.length]
  })) || [];

  const radarData = data.interview_evaluations?.map(item => ({
    category: item.category,
    score: item.score,
    fullMark: 10
  })) || [];

  const barData = data.interview_evaluations?.map(item => ({
    name: item.category,
    score: item.score
  })) || [];

  // Calculate score class
  const getScoreClass = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 80) return "text-blue-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 60) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-8 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-4">
            <button 
              onClick={() => window.location.href = '/feedbacks'}
              className="flex items-center bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg transition-colors mr-4"
            >
              一覧に戻る
            </button>
          </div>
          <h1 className="text-3xl font-bold mb-2">面接評価：{data.candidate_name}</h1>
          <div className="flex flex-wrap gap-4 text-white/90">
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              <span>{data.interview_date}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              <span>{data.duration_minutes}分</span>
            </div>
            <div className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              <span>面接官：{data.interviewers?.name || '（未設定）'}</span>
            </div>
            <div className="flex items-center">
              <Award className="mr-2 h-5 w-5" />
              <span>総合評価：
                <span className="text-xl font-bold ml-1">{data.overall_score}</span>
                <span className="text-sm ml-1">/ 100</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-6 font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              ダッシュボード
            </button>
            <button
              onClick={() => setActiveTab('evaluations')}
              className={`py-4 px-6 font-medium transition-colors ${
                activeTab === 'evaluations'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              評価項目
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`py-4 px-6 font-medium transition-colors ${
                activeTab === 'transcript'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              面接文字起こし
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        {activeTab === 'dashboard' && (
          <>
            {/* Dashboard View */}
            
            {/* Summary - 最上部に移動 */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-indigo-500" />
                総評
              </h2>
              {data.summary ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <h3 className="font-semibold text-green-700 mb-2 flex items-center">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 mr-2">✓</span>
                      良かった点
                    </h3>
                    <p className="text-green-800">{data.summary.good || "データなし"}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <h3 className="font-semibold text-amber-700 mb-2 flex items-center">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100 text-amber-800 mr-2">⚠</span>
                      改善点
                    </h3>
                    <p className="text-amber-800">{data.summary.bad || "データなし"}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="font-semibold text-blue-700 mb-2 flex items-center">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 mr-2">💡</span>
                      次回へのアドバイス
                    </h3>
                    <p className="text-blue-800">{data.summary.advice || "データなし"}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  <p>サマリーデータが見つかりませんでした。</p>
                  <button 
                    onClick={() => console.log('現在のデータ:', data)} 
                    className="mt-2 text-indigo-500 underline text-sm"
                  >
                    データを確認（コンソール出力）
                  </button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Overall Score Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Award className="mr-2 h-5 w-5 text-indigo-500" />
                  総合評価スコア
                </h2>
                <div className="flex justify-center">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                      />
                      {/* Progress circle - we'll animate this */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={data.overall_score >= 80 ? "#10B981" : data.overall_score >= 70 ? "#3B82F6" : data.overall_score >= 60 ? "#F59E0B" : "#EF4444"}
                        strokeWidth="10"
                        strokeDasharray={`${data.overall_score * 2.83} 283`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-4xl font-bold ${getScoreClass(data.overall_score)}`}>
                        {data.overall_score}
                      </span>
                      <span className="text-gray-500 text-sm">/ 100点</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-sm text-gray-500">評価項目平均</div>
                      <div className="font-bold text-lg text-indigo-600">
                        {data.interview_evaluations 
                          ? (data.interview_evaluations.reduce((sum, item) => sum + item.score, 0) / 
                             data.interview_evaluations.length).toFixed(1)
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-sm text-gray-500">最高評価項目</div>
                      <div className="font-bold text-lg text-indigo-600">
                        {data.interview_evaluations
                          ? Math.max(...data.interview_evaluations.map(item => item.score))
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-sm text-gray-500">最低評価項目</div>
                      <div className="font-bold text-lg text-indigo-600">
                        {data.interview_evaluations
                          ? Math.min(...data.interview_evaluations.map(item => item.score))
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Distribution Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <PieChartIcon className="mr-2 h-5 w-5 text-indigo-500" />
                  面接セクション時間配分
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sectionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sectionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Chart and Bar Chart Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Radar Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Target className="mr-2 h-5 w-5 text-indigo-500" />
                  スキルレーダーチャート
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                    <Radar
                      name="スコア"
                      dataKey="score"
                      stroke="#4F46E5"
                      fill="#4F46E5"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <ArrowUpCircle className="mr-2 h-5 w-5 text-indigo-500" />
                  評価スコア比較
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 10]} />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Section Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-indigo-500" />
                面接タイムライン
              </h2>
              <div className="relative">
                <div className="absolute h-full w-0.5 bg-gray-200 left-16 top-0"></div>
                <div className="space-y-4">
                  {data.interview_sections?.map((section, index) => (
                    <div key={section.id} className="flex items-start relative">
                      <div className="flex-none w-16 text-right text-sm text-gray-500 pt-1 pr-4">
                        {section.start_time}
                      </div>
                      <div 
                        className="flex-none w-6 h-6 rounded-full flex items-center justify-center relative z-10"
                        style={{ backgroundColor: SECTION_COLORS[index % SECTION_COLORS.length] }}
                      >
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="ml-4 bg-gray-50 rounded-lg p-4 flex-grow" 
                        style={{ borderLeft: `3px solid ${SECTION_COLORS[index % SECTION_COLORS.length]}` }}>
                        <div className="font-semibold text-gray-800">{section.title}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {section.start_time}〜{section.end_time}（全体の{section.percentage}%）
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'evaluations' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">🎯 評価項目詳細</h2>
            {data.interview_evaluations?.map((item, index) => (
              <div key={item.id} className="mb-8 border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between bg-gray-50 p-4 border-b">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <h3 className="font-bold text-gray-800">{item.category}</h3>
                  </div>
                  <div className="flex items-center">
                    <div className={`text-2xl font-bold ${getScoreClass(item.score * 10)}`}>
                      {item.score}
                    </div>
                    <span className="text-gray-500 ml-1">/10</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-5">
                    <h4 className="flex items-center text-base font-bold text-indigo-600 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      評価理由
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-md border-l-4 border-indigo-400">
                      <p className="text-gray-800">{item.reason}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="flex items-center text-base font-bold text-purple-600 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      改善提案
                    </h4>
                    <div className="bg-purple-50 p-3 rounded-md border-l-4 border-purple-400">
                      <p className="text-gray-800">{item.advice}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full" 
                      style={{ 
                        width: `${item.score * 10}%`, 
                        backgroundColor: COLORS[index % COLORS.length] 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-indigo-500" />
              面接文字起こし全文
            </h2>
            {data.transcript ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">{data.transcript}</pre>
              </div>
            ) : (
              <div className="text-gray-500 italic">文字起こしデータがありません</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}