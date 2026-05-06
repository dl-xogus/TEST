import clientPromise from '@/lib/mongodb'

async function getCollection() {
    const client = await clientPromise;
    return client.db('store_pilot').collection('sale');
}

export async function getSales(ownerId, storeId) {
    const col = await getCollection();
    const doc = await col.findOne({ ownerId, storeId });

    if (!doc) return [];

    return doc.sales || [];
};

export async function deleteSales(ownerId, storeId, datesParam) {
    const dates = datesParam ? datesParam.split(',') : [];
    if (dates.length === 0)
        throw new Error('dates required');

    const col = await getCollection();

    // sales 배열에서 해당 date들 일괄 제거
    await col.updateOne(
        { ownerId, storeId },
        { $pull: { sales: { date: { $in: dates } } } }
    );
};

export async function postSales(ownerId, storeId, date, day, dailySales, details) {
    const col = await getCollection();
    const newEntry = { date, day, dailySales, details: details ?? [] };

    // 해당 문서가 없으면 생성, 있으면 sales 배열에 추가
    await col.updateOne(
        { ownerId, storeId },
        { $push: { sales: newEntry } },
        { upsert: true }
    );
};