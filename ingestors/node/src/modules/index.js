const { init: ExpressModule } = require("./express");
const { init: KoaModule } = require("./koa");
const { getDependencies } = require("../utils")

function setup({ host, key, pool }) {
    let dependencies = getDependencies()
    try {
        if (dependencies.includes("express")) ExpressModule({ key, host, pool })
    } catch (err) {
        // pass
    }
    try {
        if (dependencies.includes("koa")) KoaModule({ key, host, pool })
    } catch (err) {
        // pass
    }
}

module.exports = setup