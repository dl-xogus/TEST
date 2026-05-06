import clientPromise from '@/lib/mongodb'

export async function POST(request) {
    const body = await request.json();
console.log(body)
    const client = await clientPromise;
      const res = await client.db('store_pilot').collection('account').findOne({id:body.email});
      if(!res){
       await client.db('store_pilot').collection('account').insertOne({id:body.email,password:body.password,name:body.name});
       return Response.json({ result:null });
      }else{
        return Response.json({ result:'a' });
      }
};