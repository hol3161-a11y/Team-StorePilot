import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URL
let client
let clientPromise

// 개발 환경에서는 핫리로드 때마다 새 연결이 생기는 걸 방지하기 위해 전역에 캐싱
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri)
  clientPromise = client.connect()
}

export default clientPromise
