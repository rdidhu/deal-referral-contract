const Deal = artifacts.require('./Deal.sol')
const WTToken = artifacts.require('./WTToken')

contract('Deal', function (accounts) {
    let wttoken
    let deal

    beforeEach('setup contract for each test', async function () {
        owner = accounts[0]
        investor1 = accounts[1]
        investor2 = accounts[2]
        routerOwner1 = accounts[3]
        routerOwner2 = accounts[4]
        routerOwner3 = accounts[5]
        routerOwner4 = accounts[6]
        routerOwner5 = accounts[7]
        newOwner = accounts[8]
        wttoken = await WTToken.new(owner)
        deal = await Deal.new(wttoken.address)
    })

    it('has an owner', async function () {
        assert.equal(await deal.owner(), owner)
    })

    it ('has wttoken address in deal', async function() {
        assert.equal(await deal.token(), wttoken.address)
    })

    it ('update wttoken address in deal', async function(){
        newToken = await WTToken.new(owner)
        await deal.updateTokenAddress(newToken.address)
        assert.equal(await deal.token(), newToken.address)
    })

    it ('transfer tokens to investor', async function() {
        await wttoken.transfer(investor1, 1000)
        assert.equal(await wttoken.balanceOf(investor1), 1000)
    })

    it ('creates campaign', async function() {
        await wttoken.approve(deal.address, 1000, {from: investor1})
        await wttoken.approve(deal.address, 1500, {from: investor2})
        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})
        campaign = await deal.getCampaignById(0)
        assert.equal(campaign[0], routerOwner1)
        assert.equal(campaign[1], routerOwner2)

        await deal.createCampaign([routerOwner2, routerOwner3], 500, {from: investor2})
        campaign = await deal.getCampaignById(1)
        assert.equal(campaign[0], routerOwner2)
        assert.equal(campaign[1], routerOwner3) 

        await deal.createCampaign([routerOwner1, routerOwner2], 800, {from: investor2})
        campaign = await deal.getCampaignById(2)
        assert.equal(campaign[0], routerOwner1)
        assert.equal(campaign[1], routerOwner2) 
    })

    it ('does not create campaign because not approved tokens', async function() {
        try {
          await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1}) 
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('sends coins to router owners', async function() {
        await wttoken.transfer(investor1, 1500)
        await wttoken.transfer(investor2, 2500)

        await wttoken.approve(deal.address, 1500, {from: investor1})
        await wttoken.approve(deal.address, 2500, {from: investor2})

        await deal.createCampaign([routerOwner1, routerOwner2], 1000, {from: investor1})
        await deal.createCampaign([routerOwner3, routerOwner4], 1600, {from: investor2})
        await deal.createCampaign([routerOwner5], 400, {from: investor1})
        await deal.createCampaign([routerOwner5], 500, {from: investor2})

        await deal.sendCoin(investor1, 0, [300, 700])
        await deal.sendCoin(investor2, 1, [1000, 600])
        await deal.sendCoin(investor1, 2, [400])
        await deal.sendCoin(investor2, 3, [500])

        assert.equal(await wttoken.balanceOf(routerOwner1), 300)
        assert.equal(await wttoken.balanceOf(routerOwner2), 700)
        assert.equal(await wttoken.balanceOf(routerOwner3), 1000)
        assert.equal(await wttoken.balanceOf(routerOwner4), 600)
        assert.equal(await wttoken.balanceOf(routerOwner5), 900)

        assert.equal(await wttoken.balanceOf(investor1), 100)
        assert.equal(await wttoken.balanceOf(investor2), 400)
    })
})