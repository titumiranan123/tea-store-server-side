const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
require("dotenv").config();
const app = express()
const port = process.env.PORT || 5000
app.use(cors())
app.use(express.json());

app.get('/', (req, res) => {

    res.send('server is runing')

})


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.VITE_USER_NAME}:${process.env.VITE_USER_PASSWORD}@cluster0.yhyrmpz.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();

        const productCollection = client.db('tea-store').collection('products')
        const categoryCollection = client.db('tea-store').collection('categorys')
        const reviewCollection = client.db('tea-store').collection('reviews')
        const popularbrandCollection = client.db('tea-store').collection('popularbrands')
        const cartCollection = client.db('tea-store').collection('carts')
        const userCollection = client.db('tea-store').collection('users')


        const verifyJWT = (req, res, next) => {
            const authorization = req.headers.authorization;

            if (!authorization) {
                return res.status(401).send({ error: true, message: 'unauthorized access' })
            }
            // bearer token
            const token = authorization.split(' ')[1];
            jwt.verify(token, process.env.VITE_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ error: true, message: 'unauthorized access' })

                }
                req.decoded = decoded;

                next();
            })
        }

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.VITE_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        // veryfi admin 
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;

            const query = { email: email }
            const user = await userCollection.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' })
            }
            next()

        }

        // user api 
        app.post('/users', async (req, res) => {
            const item = req.body;

            const query = { email: item.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }

            const result = await userCollection.insertOne(item);
            res.send(result);

        })
        // user all api
        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const cursor = userCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        //make admin api

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const result = { admin: user?.role === 'admin' }
            res.send(result)
        })

        app.get('/products', async (req, res) => {
            const cursor = productCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/categorys', async (req, res) => {
            const cursor = categoryCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/reviews', async (req, res) => {
            const cursor = reviewCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/popularbrands', async (req, res) => {
            const cursor = popularbrandCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post('/carts', async (req, res) => {
            const item = req.body;


            const result = await cartCollection.insertOne(item);
            res.send(result);

        });

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query)
            res.send(result)
        })

        app.get('/carts', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail)
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbiden access' })
            }
            if (!email) {
                res.send([])
            }
            const query = { email: email }
            const cursor = cartCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`server is running ${port}`)
})