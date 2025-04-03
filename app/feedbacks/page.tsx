'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts'

type InterviewSession = {
  id: string
  candidate_name: string
  interview_date: string
  duration_minutes: number
  overall_score: number
  created_at: string
  got_offer?: boolean
  interviewers?: {
    id: string
    name: string
  }
  evaluations?: {
    category: string
    score: number
  }[]
}

type Interviewer = {
  id: string
  name: string
}

export default function InterviewSessionsPage() {
  const [data, setData] = useState<InterviewSession[]>([])
  const [interviewers, setInterviewers] = useState<Interviewer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [view, setView] = useState<'list' | 'analytics'>('list')
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>('')
  const [analyticsTab, setAnalyticsTab] = useState<'overview' | 'interviewer'>('overview')

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-100 text-emerald-900 border border-emerald-200'
    if (score >= 70) return 'bg-blue-100 text-blue-900 border border-blue-200'
    if (score >= 50) return 'bg-amber-100 text-amber-900 border border-amber-200'
    return 'bg-red-100 text-red-900 border border-red-200'
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch interview sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('interview_sessions')
          .select(`
            id,
            candidate_name,
            interview_date,
            duration_minutes,
            overall_score,
            created_at,
            got_offer,
            interviewers (
              id,
              name
            ),
            interview_evaluations (
              category,
              score
            )
          `)
          .order('created_at', { ascending: false })

        if (sessionsError) {
          console.error('セッション取得エラー:', sessionsError);
          throw new Error(`セッション取得エラー: ${sessionsError.message}`);
        }

        // Fetch all interviewers
        const { data: interviewersData, error: interviewersError } = await supabase
          .from('interviewers')
          .select('id, name')

        if (interviewersError) {
          console.error('面接官取得エラー:', interviewersError);
          throw new Error(`面接官取得エラー: ${interviewersError.message}`);
        }

        // データが正常に取得できた場合の処理
        if (sessionsData && interviewersData) {
          const fixedData = (sessionsData as any[]).map((item) => ({
            ...item,
            interviewers: Array.isArray(item.interviewers) ? item.interviewers[0] : item.interviewers,
            evaluations: item.interview_evaluations
          }))
          
          setData(fixedData as InterviewSession[])
          setInterviewers(interviewersData as Interviewer[])
          
          // Set default selected interviewer if available
          if (interviewersData.length > 0) {
            setSelectedInterviewer(interviewersData[0].id)
          }
        }
      } catch (error: any) {
        console.error('データ取得中にエラーが発生しました:', error);
        setError(error.message || 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData()
  }, [])

  const filteredData = data.filter((fb) =>
    fb.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fb.interviewers?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Helper functions for analytics
  const getInterviewerAverages = (interviewerId: string) => {
    const sessions = data.filter(s => s.interviewers?.id === interviewerId);
    if (sessions.length === 0) return [];
    
    // Get unique category names across all evaluations
    const allCategories = new Set<string>();
    sessions.forEach(session => {
      session.evaluations?.forEach(evaluation => {
        allCategories.add(evaluation.category);
      });
    });
    
    return Array.from(allCategories).map(category => {
      const scores = sessions.flatMap(s => {
        const evaluation = s.evaluations?.find(e => e.category === category);
        return evaluation ? [evaluation.score] : [];
      });
      
      const avg = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
      
      return { category, value: avg };
    });
  };

  const getOverallAverages = () => {
    if (data.length === 0) return [];
    
    // Get unique category names across all evaluations
    const allCategories = new Set<string>();
    data.forEach(session => {
      session.evaluations?.forEach(evaluation => {
        allCategories.add(evaluation.category);
      });
    });
    
    return Array.from(allCategories).map(category => {
      const allScores = data.flatMap(s => {
        const evaluation = s.evaluations?.find(e => e.category === category);
        return evaluation ? [evaluation.score] : [];
      });
      
      const avg = allScores.length > 0
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length
        : 0;
      
      return { category, value: avg };
    });
  };

  const getInterviewerGrowth = (interviewerId: string) => {
    const sessions = data
      .filter(s => s.interviewers?.id === interviewerId)
      .sort((a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime());
    
    return sessions.map(s => ({
      date: s.interview_date,
      score: s.overall_score,
      name: s.interviewers?.name || 'Unknown'
    }));
  };

  const getOfferCorrelation = () => {
    return data
      .filter(s => s.got_offer !== undefined)
      .map(s => ({
        score: s.overall_score,
        got_offer: s.got_offer ? 1 : 0,
        interviewer: s.interviewers?.name || 'Unknown'
      }));
  };

  const getInterviewerStrengthsWeaknesses = (interviewerId: string) => {
    const averages = getInterviewerAverages(interviewerId);
    const strengths = [...averages].sort((a, b) => b.value - a.value).slice(0, 3);
    const weaknesses = [...averages].sort((a, b) => a.value - b.value).slice(0, 3);
    
    return {
      strengths,
      weaknesses
    };
  };

  const calculateOfferRate = (interviewerId: string) => {
    const sessions = data.filter(s => s.interviewers?.id === interviewerId && s.got_offer !== undefined);
    if (sessions.length === 0) return 0;
    
    const offersGiven = sessions.filter(s => s.got_offer).length;
    return Math.round((offersGiven / sessions.length) * 100);
  };

  const radarData = selectedInterviewer ? getInterviewerAverages(selectedInterviewer) : [];
  const overallAverageData = getOverallAverages();
  const growthData = selectedInterviewer ? getInterviewerGrowth(selectedInterviewer) : [];
  const offerCorrelationData = getOfferCorrelation();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">面接官ごとの平均スコア</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={interviewers.map(interviewer => {
              const sessions = data.filter(s => s.interviewers?.id === interviewer.id);
              const avgScore = sessions.length > 0 
                ? sessions.reduce((sum, s) => sum + s.overall_score, 0) / sessions.length 
                : 0;
              return {
                name: interviewer.name,
                score: parseFloat(avgScore.toFixed(1))
              };
            })}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" fill="#8884d8" name="平均スコア" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">面接項目別平均スコア</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={overallAverageData.map(item => ({
              name: item.category,
              score: parseFloat(item.value.toFixed(1))
            }))}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 10]} />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" fill="#FF8042" name="平均スコア" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  
  const renderInterviewerDetails = () => {
    if (!selectedInterviewer) return <div className="text-center py-10">面接官が選択されていません</div>;
    
    const interviewerName = interviewers.find(i => i.id === selectedInterviewer)?.name || '';
    const { strengths, weaknesses } = getInterviewerStrengthsWeaknesses(selectedInterviewer);
    
    // レーダーチャート用にデータを結合
    const combinedRadarData = radarData.map(item => {
      // この評価カテゴリの全体平均を検索
      const overallAvg = overallAverageData.find(
        avg => avg.category === item.category
      );
      
      return {
        category: item.category,
        interviewerValue: item.value,
        overallValue: overallAvg ? overallAvg.value : 0
      };
    });
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">評価項目レーダーチャート（全体平均との比較）</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart outerRadius={90} data={combinedRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis domain={[0, 10]} />
              <Radar
                name={interviewerName}
                dataKey="interviewerValue"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Radar
                name="全体平均"
                dataKey="overallValue"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.4}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">スコア推移</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={growthData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[70, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                name={interviewerName}
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">強みと弱み</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-600 mb-2">強み（上位3項目）</h4>
              <ul className="space-y-2">
                {strengths.map((strength, idx) => (
                  <li key={idx} className="flex justify-between items-center border-b pb-1">
                    <span className="text-gray-800">{strength.category}</span>
                    <span className="font-semibold text-gray-900">{strength.value.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-600 mb-2">弱み（下位3項目）</h4>
              <ul className="space-y-2">
                {weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex justify-between items-center border-b pb-1">
                    <span className="text-gray-800">{weakness.category}</span>
                    <span className="font-semibold text-gray-900">{weakness.value.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-gray-700 font-medium">データを読み込み中...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto bg-white p-8 rounded-xl shadow-md border border-red-200">
          <div className="text-red-500 text-5xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">エラーが発生しました</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">面接セッション管理</h1>
            <p className="text-gray-700">面接候補者と面接官の評価セッションを管理・閲覧できます</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                view === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              一覧表示
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                view === 'analytics'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              分析ダッシュボード
            </button>
            <Link
              href="/submit"
              className="inline-flex items-center px-5 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
            >
              新規セッション登録
            </Link>
          </div>
        </div>

        {view === 'list' ? (
          // List View
          <>
            <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="候補者名または面接官で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-gray-700 w-full border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4 text-sm font-medium text-gray-700">
              全{filteredData.length}件の結果
            </div>

            <div className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">候補者</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">面接日</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">面接官</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">総合評価</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">内定</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">所要時間</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">登録日時</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-700 font-medium">
                          該当するデータがありません
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((fb) => (
                        <tr key={fb.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <Link href={`/feedbacks/${fb.id}`} className="text-indigo-700 hover:text-indigo-900 hover:underline font-medium">
                              {fb.candidate_name}
                            </Link>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-gray-800">{fb.interview_date}</td>
                          <td className="px-6 py-5 whitespace-nowrap text-gray-800">{fb.interviewers?.name || '（未設定）'}</td>
                          <td className="px-6 py-5 whitespace-nowrap text-center">
                            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getScoreColor(fb.overall_score)}`}>
                              {fb.overall_score} 点
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-center">
                            {fb.got_offer === true && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                </svg>
                                内定
                              </span>
                            )}
                            {fb.got_offer === false && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                未内定
                              </span>
                            )}
                            {fb.got_offer === null && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                未定
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-center text-gray-800 font-medium">
                            {fb.duration_minutes} 分
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-center text-sm text-gray-700">
                            {new Date(fb.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          // Analytics Dashboard View
          <>
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <div className="flex space-x-3">
                <button
                  onClick={() => setAnalyticsTab('overview')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    analyticsTab === 'overview'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  全体分析
                </button>
                <button
                  onClick={() => setAnalyticsTab('interviewer')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    analyticsTab === 'interviewer'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  面接官別分析
                </button>
              </div>
              
              {analyticsTab === 'interviewer' && (
                <select
                  value={selectedInterviewer}
                  onChange={(e) => setSelectedInterviewer(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {interviewers.map((interviewer) => (
                    <option key={interviewer.id} value={interviewer.id}>
                      {interviewer.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {analyticsTab === 'overview' ? renderOverview() : renderInterviewerDetails()}
          </>
        )}
      </div>
    </div>
  )
}