import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getSales, deleteSales, postSales } from '@/lib/db/sales'

async function getCollection() {
  const client = await clientPromise;
  return client.db('store_pilot').collection('sale');
};

// GET /api/sales?ownerId=xxx&storeId=xxx
// 특정 매장의 매출 전체 조회
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get('ownerId');
  const storeId = searchParams.get('storeId');

  const sales = await getSales(ownerId, storeId);

  return NextResponse.json({ sales });
};

// POST /api/sales
// 새 날짜 매출 추가
// body: { ownerId, storeId, date, day, dailySales, details }
export async function POST(request) {
  const { ownerId, storeId, date, day, dailySales, details } = await request.json()

  await postSales(ownerId, storeId, date, day, dailySales, details);

  return NextResponse.json({ ok: true })
}

// PUT /api/sales
// 특정 날짜 매출 수정
// body: { ownerId, storeId, date, day, dailySales, details }
export async function PUT(request) {
  const { ownerId, storeId, date, day, dailySales, details } = await request.json()

  const col = await getCollection()

  // sales 배열에서 date가 일치하는 항목만 교체
  await col.updateOne(
    { ownerId, storeId, 'sales.date': date },
    { $set: { 'sales.$': { date, day, dailySales, details } } }
  )

  return NextResponse.json({ ok: true })
}

// DELETE /api/sales/db?ownerId=xxx&storeId=xxx&dates=xxx,yyy,zzz
// 체크된 날짜들 일괄 삭제 (쉼표 구분)
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get('ownerId');
  const storeId = searchParams.get('storeId');
  const datesParam = searchParams.get('dates');

  try {
    await deleteSales(ownerId, storeId, datesParam);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e.message === 'dates required')
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
