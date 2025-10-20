import fs from "fs"
import path from "path"
import multer from "multer";
import { Product } from "../models/productsModel.js";

const upload = multer({ dest: "uploads" });

const cleanUpStorage = ()=>{
    try {
        const relPath = path.join(__dirname__, "uploads")
        fs.unlinkSync(relPath)
    } catch (err) {
        console.log(err)
        return err
    }
}

const populateUserCart = async(userCart)=>{
    try {
        console.log(userCart)
        if(!userCart || userCart?.length <= 0) return []
        const productsId = userCart.map((cartItem)=>cartItem.productId)
        const products = await Product.find({productId: {$in: productsId}}).lean()
        if (!products || products?.length <= 0) return []
        const productsMap = new Map(products.map((product)=>[product.productId, product]))
        const newUserCart = userCart.map((cartItem)=>{
            const productObj = productsMap.get(cartItem.productId)
            if (productObj){
                return {...cartItem, ...productObj}
            }
        })
        return newUserCart
    } catch (err) {
        console.log(err)
        throw err
    }
}

const emailJsLogoSvg = `svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  width="256"
                  height="256"
                >
                  <defs>
                    {/* <!-- Gradient --> */}
                    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--text-secondary)" />
                      <stop offset="100%" stopColor="var(--main-primary)" />
                    </linearGradient>
                  </defs>

                  {/* <!-- Background Circle --> */}
                  <circle
                    cx="256"
                    cy="256"
                    r="240"
                    fill="var(--text-primary)"
                  />

                  {/* <!-- LM Letters --> */}
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    className="text-[150px] sm:text-[200px] font-bold"
                    fill="url(#grad)"
                    letterSpacing="-10"
                  >
                    LM
                  </text>
                </svg>`


export {upload, cleanUpStorage, populateUserCart, emailJsLogoSvg}