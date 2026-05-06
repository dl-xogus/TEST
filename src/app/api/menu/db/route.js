import { NextResponse } from 'next/server'
import { getMenus } from '@/lib/db/menu'
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/* 메뉴 목록 조회 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get('ownerId');
  const storeId = searchParams.get('storeId');

  const menu = await getMenus(ownerId, storeId);

  return NextResponse.json({ menu: menu || [] });
};


/* 메뉴 목록 추가 */
export async function POST(request) {
  try {
    const body = await request.json();


    const { ownerId, name, price, category, status } = body;

    console.log("받은 데이터:", body);

    const client = await clientPromise;
    const db = client.db('store_pilot');
    const col = db.collection('menu');

    const result = await col.updateOne(
      { ownerId },
      {
        $push: {
          menu: {
            _id: new ObjectId(),
            name,
            price,
            category,
            status,
            createdAt: new Date()
          }
        }
      },
      { upsert: true } // 문서 없으면 생성
    );

    console.log("insert 성공:", result);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/* 메뉴 목록 삭제 */
export async function DELETE(request) {
  try {
    const body = await request.json();

    const { ownerId, ids } = body;

    const client = await clientPromise;
    const db = client.db('store_pilot');
    const col = db.collection('menu');

    

    const result = await col.updateOne(
      { ownerId},
      {
        $pull: {
          menu: {
            _id: { $in: ids.map(id => new ObjectId(id)) }
          }
        }
      }
    );

    console.log("삭제 결과:", result);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("삭제 에러:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}


/* 메뉴 목록 수정 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { ownerId, menu } = body;

    

    const client = await clientPromise;
    const db = client.db('store_pilot');
    const col = db.collection('menu');

    const menu_obtid = menu.map(obj=>{
      obj._id = new ObjectId(obj._id);
      return obj;
    })

    const result = await col.updateOne(
      {"ownerId": ownerId},
      { $set: {"menu":menu_obtid}}
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("수정 에러:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}