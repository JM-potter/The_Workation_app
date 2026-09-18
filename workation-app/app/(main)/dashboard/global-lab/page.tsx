'use client'

import React, { useState } from 'react'
import Header from '@/components/ui/Header'

export default function GlobalLabPage() {
  const [exchangeRate, setExchangeRate] = useState(9.12) // JPY to KRW default
  const [jpyAmount, setJpyAmount] = useState('')
  const [category, setCategory] = useState('식비')
  
  const krwAmount = jpyAmount ? Math.round(Number(jpyAmount) * exchangeRate) : 0

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-6 text-white mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 text-9xl opacity-10">✈️</div>
          <div className="relative z-10">
            <h1 className="text-2xl font-black mb-2 tracking-tight">Global Lab: Premium Expedition</h1>
            <p className="text-sm text-purple-200">도쿄(Tokyo) 테스트 지역 전용 워케이션 라운지입니다.</p>
            <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2">
              <p className="text-xs font-semibold">
                ⚠️ 완벽한 디지털 디톡스를 위해 오프라인에서도 퀘스트 완료가 가능합니다.<br/>네트워크 연결 시 데이터가 자동 동기화됩니다.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quest & Handshake UI */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-lg text-slate-800">스마트 핸드셰이크</h2>
              <span className="text-xl">🤝</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">오늘의 목표 (Quest)</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  rows={3}
                  placeholder="예: 시부야 QWS에서 스타트업 문화 리서치"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📓</div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">Notion 워크스페이스 연동</div>
                    <div className="text-xs text-slate-500">작성한 인사이트를 노션 DB로 자동 동기화</div>
                  </div>
                </div>
                <button className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold py-2 px-4 rounded-full text-xs transition-colors">
                  [연동됨]
                </button>
              </div>
              
              <button className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <span>✨</span> AI 회고 생성 및 노션으로 보내기
              </button>
            </div>
          </div>

          {/* Receipt & 1-Billing UI */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-lg text-slate-800">1-Billing 영수증 정산</h2>
              <span className="text-xl">🧾</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">현지 환율에 맞춰 사용 금액을 입력하고, 지출 카테고리를 선택해 주세요. (수동 입력)</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">오늘의 환율 (엔화 → 원화)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                    className="w-24 bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm"
                    step="0.01"
                  />
                  <span className="text-sm font-semibold text-slate-600">원 / 1 JPY</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">사용 금액 (엔화)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={jpyAmount}
                      onChange={(e) => setJpyAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm pl-3 pr-8"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2 text-sm text-slate-400 font-bold">¥</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">카테고리</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm"
                  >
                    <option>식비</option>
                    <option>교통</option>
                    <option>액티비티/입장료</option>
                    <option>코워킹 스페이스</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <div className="text-xs text-purple-600 font-bold mb-1">최종 청구 원화 (예상)</div>
                <div className="text-2xl font-black text-purple-900">{krwAmount.toLocaleString()}원</div>
              </div>

              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-purple-200">
                영수증 사진 첨부 및 정산 제출
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
