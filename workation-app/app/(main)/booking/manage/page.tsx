'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'
import Button from '@/components/ui/Button'
import { useHrOnly } from '@/lib/useHrOnly'
import { memberRequest } from '@/lib/membership-client'

type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

type Booking = {
  id: string
  start_date: string
  end_date: string
  guests: number
  total_price: number
  status: BookingStatus
  accommodations: { name: string; region: string } | null
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: '예약 확정',
  pending:   '대기중',
  cancelled: '취소됨',
}

const STATUS_COLOR: Record<BookingStatus, string> = {
  confirmed: 'bg-emerald-500/20 text-emerald-600',
  pending:   'bg-amber-500/20 text-amber-600',
  cancelled: 'bg-[#F1F5F9] text-[#94A3B8]',
}

export default function BookingManagePage() {
  useHrOnly()
  const [bookings, setBookings]       = useState<Booking[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<string | null>(null)
  const [editMode, setEditMode]       = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [newCheckIn,  setNewCheckIn]  = useState('')
  const [newCheckOut, setNewCheckOut] = useState('')
  const [newGuests,   setNewGuests]   = useState(1)
  const [done, setDone]               = useState<'changed' | 'cancelled' | null>(null)
  const [saving, setSaving]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    memberRequest('/api/bookings').then(({ bookings: data }) => {
      setBookings(data as Booking[])
    }).catch((error) => alert(error instanceof Error ? error.message : '예약 정보를 불러오지 못했습니다.')).finally(() => setLoading(false))
  }, [])

  const booking = bookings.find(b => b.id === selected)

  function openEdit(b: Booking) {
    setSelected(b.id)
    setNewCheckIn(b.start_date)
    setNewCheckOut(b.end_date)
    setNewGuests(b.guests)
    setEditMode(true)
    setConfirmCancel(false)
    setDone(null)
  }

  async function applyChange() {
    if (!selected) return
    setSaving(true)
    const nights = Math.max(1, Math.round(
      (new Date(newCheckOut).getTime() - new Date(newCheckIn).getTime()) / 86400000
    ))
    const b = booking!
    const pricePerNight = b.total_price / (b.guests * Math.max(1, Math.round(
      (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000
    )))
    const newTotal = Math.round(pricePerNight) * nights * newGuests

    try { await memberRequest('/api/bookings', { method: 'PATCH', body: JSON.stringify({ id: selected, startDate: newCheckIn, endDate: newCheckOut, guests: newGuests, totalPrice: newTotal }) }) }
    catch (error) { setSaving(false); alert('변경 실패: ' + (error instanceof Error ? error.message : '다시 시도해 주세요.')); return }
    setSaving(false)

    setBookings(prev => prev.map(b =>
      b.id === selected ? { ...b, start_date: newCheckIn, end_date: newCheckOut, guests: newGuests, total_price: newTotal } : b
    ))
    setDone('changed')
    setEditMode(false)
  }

  async function deleteBooking() {
    if (!selected) return
    setSaving(true)
    try { await memberRequest(`/api/bookings?id=${encodeURIComponent(selected)}`, { method: 'DELETE' }) }
    catch (error) { setSaving(false); alert('삭제 실패: ' + (error instanceof Error ? error.message : '다시 시도해 주세요.')); return }
    setSaving(false)
    setBookings(prev => prev.filter(b => b.id !== selected))
    setSelected(null)
    setConfirmDelete(false)
  }

  async function applyCancel() {
    if (!selected) return
    setSaving(true)
    try { await memberRequest('/api/bookings', { method: 'PATCH', body: JSON.stringify({ id: selected, status: 'cancelled' }) }) }
    catch (error) { setSaving(false); alert('취소 실패: ' + (error instanceof Error ? error.message : '다시 시도해 주세요.')); return }
    setSaving(false)

    setBookings(prev => prev.map(b =>
      b.id === selected ? { ...b, status: 'cancelled' } : b
    ))
    setDone('cancelled')
    setConfirmCancel(false)
  }

  const nights = (b: Booking) => Math.max(1, Math.round(
    (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000
  ))

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header role="hr" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs text-[#94A3B8] hover:text-[#475569] mb-2 block">← 대시보드</Link>
          <h1 className="text-2xl font-black mb-1">예약 변경·취소</h1>
          <p className="text-sm text-[#475569]">예약 일정 수정 또는 취소 처리</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#94A3B8]">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
            예약 내역 불러오는 중...
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-5">
            {/* 예약 목록 */}
            <div className="col-span-3 flex flex-col gap-3">
              {bookings.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center text-[#94A3B8] text-sm">
                  예약 내역이 없어요
                </div>
              ) : bookings.map(b => (
                <button
                  key={b.id}
                  onClick={() => { setSelected(b.id); setEditMode(false); setConfirmCancel(false); setConfirmDelete(false); setDone(null) }}
                  className={`w-full text-left bg-white border rounded-2xl p-5 transition-all ${
                    selected === b.id ? 'border-blue-500/60' : 'border-[#E2E8F0] hover:border-[#94A3B8]'
                  } ${b.status === 'cancelled' ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-sm">{b.accommodations?.name ?? '-'}</div>
                      <div className="text-xs text-[#94A3B8] mt-0.5">📍 {b.accommodations?.region ?? '-'}</div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-lg ${STATUS_COLOR[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#475569]">
                    <span>📅 {b.start_date} ~ {b.end_date} ({nights(b)}박)</span>
                    <span>👥 {b.guests}명</span>
                    <span>💰 {b.total_price?.toLocaleString()}원</span>
                  </div>
                </button>
              ))}
            </div>

            {/* 상세 패널 */}
            <div className="col-span-2">
              {!booking ? (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-center text-sm text-[#94A3B8]">
                  예약을 선택하면<br />변경·취소 옵션이 나타납니다
                </div>
              ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col gap-4">
                  <div>
                    <div className="font-bold mb-1">{booking.accommodations?.name ?? '-'}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_COLOR[booking.status]}`}>
                      {STATUS_LABEL[booking.status]}
                    </span>
                  </div>

                  {done === 'changed' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-600">
                      ✅ 예약이 변경됐어요
                    </div>
                  )}
                  {done === 'cancelled' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-500">
                      🚫 예약이 취소됐어요
                    </div>
                  )}

                  {booking.status === 'cancelled' && (
                    <div className="flex flex-col gap-3">
                      <div className="bg-[#F1F5F9] rounded-xl p-3 text-xs text-[#94A3B8] text-center">
                        취소된 예약입니다
                      </div>
                      {confirmDelete ? (
                        <>
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-[#475569]">
                            <div className="font-semibold text-red-500 mb-1">예약 내역을 삭제하시겠어요?</div>
                            <div className="text-[#94A3B8]">삭제하면 복구할 수 없습니다</div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1 text-sm" onClick={() => setConfirmDelete(false)}>돌아가기</Button>
                            <button onClick={deleteBooking} disabled={saving}
                              className="flex-1 text-sm py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold transition-colors">
                              {saving ? '삭제 중...' : '삭제 확정'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(true)}
                          className="w-full text-sm py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors font-medium">
                          🗑️ 예약 내역 삭제
                        </button>
                      )}
                    </div>
                  )}

                  {booking.status !== 'cancelled' && !done && (
                    <>
                      {editMode ? (
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="text-xs text-[#475569] mb-1 block">체크인</label>
                            <input type="date" value={newCheckIn} onChange={e => setNewCheckIn(e.target.value)}
                              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="text-xs text-[#475569] mb-1 block">체크아웃</label>
                            <input type="date" value={newCheckOut} onChange={e => setNewCheckOut(e.target.value)}
                              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="text-xs text-[#475569] mb-1 block">인원</label>
                            <select value={newGuests} onChange={e => setNewGuests(Number(e.target.value))}
                              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-500">
                              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}명</option>)}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1 text-sm" onClick={() => setEditMode(false)}>취소</Button>
                            <Button className="flex-1 text-sm" onClick={applyChange} disabled={saving}>
                              {saving ? '저장 중...' : '변경 확정'}
                            </Button>
                          </div>
                        </div>
                      ) : confirmCancel ? (
                        <div className="flex flex-col gap-3">
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-[#475569]">
                            <div className="font-semibold text-red-500 mb-1">예약을 취소하시겠어요?</div>
                            <div className="text-xs text-[#94A3B8]">이 작업은 되돌릴 수 없습니다</div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1 text-sm" onClick={() => setConfirmCancel(false)}>돌아가기</Button>
                            <button onClick={applyCancel} disabled={saving}
                              className="flex-1 text-sm py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold transition-colors">
                              {saving ? '처리 중...' : '취소 확정'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="bg-[#F1F5F9] rounded-xl p-3 text-xs text-[#475569] flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span className="text-[#94A3B8]">체크인</span>
                              <span>{booking.start_date}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#94A3B8]">체크아웃</span>
                              <span>{booking.end_date}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#94A3B8]">인원</span>
                              <span>{booking.guests}명</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t border-[#E2E8F0] pt-1 mt-1">
                              <span className="text-[#94A3B8]">결제 금액</span>
                              <span>{booking.total_price?.toLocaleString()}원</span>
                            </div>
                          </div>
                          <Button className="w-full text-sm" onClick={() => openEdit(booking)}>
                            📅 날짜·인원 변경
                          </Button>
                          <button onClick={() => setConfirmCancel(true)}
                            className="w-full text-sm py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors font-medium">
                            🚫 예약 취소
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
