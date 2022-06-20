const express = require('express');
const router = express.Router();
const {database} = require('../config/helpers');
const crypto = require('crypto')

//new order/////////

router.post('/new', async (req, res) => {
    let {userId, products} = req.body;
    console.log(userId);
    console.log(products);

     if (userId !== null && userId > 0) {
        database.table('pedidos')
            .insert({
               usuario_id: userId
            }).then((newOrderId) => {

            if (newOrderId.insertId > 0) {
                products.forEach(async (p) => {

                        let data = await database.table('productos').filter({id: p.id}).withFields(['stock']).get();


                        


                    let inCart = parseInt(p.incart);

                    // Deduct the number of pieces ordered from the quantity in database

                    if (data.stock > 0) {
                        data.stock = data.stock - inCart;

                        if (data.stock < 0) {
                            data.stock = 0;
                        }

                    } else {
                        data.stock = 0;
                    }

                    // Insert order details w.r.t the newly created order Id
                    database.table('pedidos_detalles')
                        .insert({
                            pedido_id: newOrderId.insertId,
                            producto_id: p.id,
                            cantidad: inCart
                        }).then(newId => {
                        database.table('productos')
                            .filter({id: p.id})
                            .update({
                                stock : data.stock
                            }).then(successNum => {
                        }).catch(err => console.log(err));
                    }).catch(err => console.log(err));
                });

            } else {
                res.json({message: 'New order failed while adding order details', success: false});
            }
            res.json({
                message: `Order successfully placed with order id ${newOrderId}`,
                success: true,
                pedido_id: newOrderId.insertId,
                productos: products
            })
        }).catch(err => res.json(err));
    }

    else {
        res.json({message: 'New order failed', success: false});
    }

});



//cancel order






// GET ALL ORDERS
router.get('/', (req, res) => {
    database.table('orders_details as od')
        .join([
            {
                table: 'orders as o',
                on: 'o.id = od.order_id'
            },
            {
                table: 'products as p',
                on: 'p.id = od.product_id'
            },
            {
                table: 'users as u',
                on: 'u.id = o.user_id'
            }
        ])
        .withFields(['o.id', 'p.title', 'p.description', 'p.price', 'u.username'])
        .getAll()
        .then(orders => {
            if (orders.length > 0) {
                res.json(orders);
            } else {
                res.json({message: "No orders found"});
            }

        }).catch(err => res.json(err));
});




module.exports = router;