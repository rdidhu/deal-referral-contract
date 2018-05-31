const Deal = artifacts.require('./Deal.sol')
const WTToken = artifacts.require('./WeToken')
const ReferralContract = artifacts.require('./ReferralContract')

contract('Deal', function (accounts) {
    let wetoken
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
        wwfAddress = accounts[9]
        tokenAmountForInvestor1 = 30000000
        tokenAmountForInvestor2 = 50000000 
        tokenForTransfer = 10000000
        tokenForApprove = 5000000
        tokensForSend1 = 1000000
        tokensForSend2 = 2000000
        tokensForSend3 = 3000000
        tokensForSend4 = 4000000
        wttoken = await WTToken.new(owner)
        deal = await Deal.new(wttoken.address, owner)
        ref1 = await ReferralContract.new(wttoken.address, routerOwner2,  routerOwner1) //for routerOwner2 (parent rO1)
        ref2 = await ReferralContract.new(wttoken.address, routerOwner3,  ref1.address) //for routerOwner3 (parent rO2)
        ref3 = await ReferralContract.new(wttoken.address, routerOwner4,  ref2.address) //for routerOwner4 (parent rO3)
        ref4 = await ReferralContract.new(wttoken.address, routerOwner5,  ref1.address) //for routerOwner4 (parent rO2)
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

    it ('does not update wttoken address in deal because not owner', async function(){
        newToken = await WTToken.new(owner)
        try {
            await deal.updateTokenAddress(newToken.address, {from: investor1})
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('transfer tokens to investor', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)
        assert.equal(await wttoken.balanceOf(investor1), tokenAmountForInvestor1)
    })

    it ('creates campaign', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)
        await wttoken.transfer(investor2, tokenAmountForInvestor2)

        await wttoken.transfer(deal.address, tokenAmountForInvestor1, {from: investor1})
        await wttoken.transfer(deal.address, tokenAmountForInvestor2, {from: investor2})

        assert.equal(await deal.getAddressCreatorById(1), investor1)
        assert.equal(await deal.getAddressCreatorById(2), investor2)

        summa = tokenAmountForInvestor1 + tokenAmountForInvestor2

        assert.equal(await wttoken.balanceOf(deal.address), summa)

    })

    it ('adds tokens to campaign', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)

        await wttoken.transfer(deal.address, tokenAmountForInvestor1 - tokenForApprove, {from: investor1})

        assert.equal(await deal.getTokenAmountForCampaign(1), tokenAmountForInvestor1 - tokenForApprove)

        await wttoken.approve(deal.address, tokenForApprove, {from: investor1})
        await deal.addTokensToCampaign(1, tokenForApprove, {from: investor1})

        assert.equal(await deal.getTokenAmountForCampaign(1), tokenAmountForInvestor1)
    })

    it ('does not add tokens to campaign because not creator', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)

        await wttoken.transfer(deal.address, tokenForTransfer, {from: investor1})

        assert.equal(await deal.getTokenAmountForCampaign(1), tokenForTransfer)

        await wttoken.approve(deal.address, tokenForApprove, {from: investor2})
        try {
            await deal.addTokensToCampaign(1, tokenForApprove, {from: investor2})
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
        
        assert.equal(await deal.getTokenAmountForCampaign(1), tokenForTransfer)
    })

    it ('does not add tokens to campaign because not enaugh approved tokens', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)

        await wttoken.transfer(deal.address, tokenForTransfer, {from: investor1})

        assert.equal(await deal.getTokenAmountForCampaign(1), tokenForTransfer)

        await wttoken.approve(deal.address, tokenForApprove, {from: investor1})
        try {
            await deal.addTokensToCampaign(1, tokenForApprove + 100, {from: investor1})
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }

        assert.equal(await deal.getTokenAmountForCampaign(1), tokenForTransfer)
    })

    it ('destroys campaign', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)
        await wttoken.transfer(deal.address, tokenAmountForInvestor1, {from: investor1})

        assert.equal(await deal.checkStatus(1), 0)
        assert.equal(await wttoken.balanceOf(deal.address), tokenAmountForInvestor1)
        assert.equal(await wttoken.balanceOf(investor1), 0)

        await deal.destroyCampaign(1, {from: owner})

        assert.equal(await deal.checkStatus(1), 1)
        assert.equal(await wttoken.balanceOf(deal.address), 0)
        assert.equal(await wttoken.balanceOf(investor1), tokenAmountForInvestor1)

    })

    it ('does not destroy campaign because sender to not equal owner', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)
        await wttoken.transfer(deal.address, tokenAmountForInvestor1, {from: investor1})

        assert.equal(await deal.checkStatus(1), 0)
        assert.equal(await wttoken.balanceOf(deal.address), tokenAmountForInvestor1)
        assert.equal(await wttoken.balanceOf(investor1), 0)
        
        try {
            await deal.destroyCampaign(1, {from: investor1})
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }

        assert.equal(await deal.checkStatus(1), 0)
        assert.equal(await wttoken.balanceOf(deal.address), tokenAmountForInvestor1)
        assert.equal(await wttoken.balanceOf(investor1), 0)
    })

    it ('sends coins to router owners', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)
        await wttoken.transfer(investor2, tokenAmountForInvestor2)

        await wttoken.transfer(deal.address, tokenAmountForInvestor1, {from: investor1})
        await wttoken.transfer(deal.address, tokenAmountForInvestor2, {from: investor2})

        await deal.sendCoin([ref1.address, ref2.address], [tokensForSend1, tokensForSend2], 1, {from: owner})
        await deal.sendCoin([ref3.address, ref4.address], [tokensForSend3, tokensForSend4], 2, {from: owner})

        tokensForRouterOwner1 = tokensForSend1*0.25 + tokensForSend2*(0.25**2) + tokensForSend3*(0.25**3) + tokensForSend4*(0.25**2)
        tokensForRouterOwner2 = tokensForSend1*0.75 + (tokensForSend2*0.25 + tokensForSend3*(0.25**2) + tokensForSend4*0.25) * 0.75
        tokensForRouterOwner3 = tokensForSend2*0.75 + tokensForSend3*0.25*0.75
        tokensForRouterOwner4 = tokensForSend3*0.75
        tokensForRouterOwner5 = tokensForSend4*0.75

        assert.equal(await wttoken.balanceOf(routerOwner1), tokensForRouterOwner1)
        assert.equal(await wttoken.balanceOf(routerOwner2), tokensForRouterOwner2)
        assert.equal(await wttoken.balanceOf(routerOwner3), tokensForRouterOwner3)
        assert.equal(await wttoken.balanceOf(routerOwner4), tokensForRouterOwner4)
        assert.equal(await wttoken.balanceOf(routerOwner5), tokensForRouterOwner5)
        
    })

    it ('finishs campaign', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)

        await wttoken.transfer(deal.address, tokenAmountForInvestor1, {from: investor1})

        await deal.sendCoin([routerOwner1, routerOwner2], [tokensForSend1, tokensForSend2], 1, {from: owner})

        assert.equal(await wttoken.balanceOf(routerOwner1), tokensForSend1)
        assert.equal(await wttoken.balanceOf(routerOwner2), tokensForSend2)

        currentBalance = tokenAmountForInvestor1 - (tokensForSend1 + tokensForSend2)

        assert.equal(await deal.getCurrentBalanceForCampaign(1), currentBalance)

        await deal.sendCoin([routerOwner3], [tokensForSend3], 1, {from: owner})

        assert.equal(await wttoken.balanceOf(routerOwner3), tokensForSend3)
        assert.equal(await deal.checkStatus(1), 0)

        currentBalance -= tokensForSend3

        assert.equal(await deal.getCurrentBalanceForCampaign(1), currentBalance)
        
        await deal.finishCampaign(1, {from: owner})

        assert.equal(await wttoken.balanceOf(investor1), currentBalance)
        assert.equal(await deal.checkStatus(1), 2)
        assert.equal(await deal.getCurrentBalanceForCampaign(1), 0)
    })

    it ('does not send coins to router owners because wrong number of tokens', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)
        await wttoken.transfer(deal.address, tokenAmountForInvestor1, {from: investor1})

        try {
           await deal.sendCoin([routerOwner1, routerOwner2], [tokenAmountForInvestor1 - 100, 200], 1)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because campaign finished', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)
        await wttoken.transfer(deal.address, tokenAmountForInvestor1, {from: investor1})
        await deal.sendCoin([routerOwner1, routerOwner2], [tokensForSend1, tokensForSend2], 1)
        await deal.finishCampaign(1, {from: owner})

        try {
           await deal.sendCoin([routerOwner1, routerOwner2], [tokensForSend1, tokensForSend2], 1)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because campaign destroyed', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)
        await wttoken.transfer(deal.address, tokenAmountForInvestor1, {from: investor1})
        await deal.destroyCampaign(1, {from: owner})

        try {
           await deal.sendCoin([routerOwner1, routerOwner2], [tokensForSend1, tokensForSend2], 1)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because wrong quantity router owners', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)
        await wttoken.transfer(deal.address, tokenAmountForInvestor1, {from: investor1})
        
        try {
           await deal.sendCoin([routerOwner1, routerOwner2], [tokensForSend1], 1)
        } catch (error) {
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

    it ('does not send coins to router owners because sender not contract owner', async function() {
        await wttoken.transfer(investor1, tokenAmountForInvestor1)
        await wttoken.transfer(deal.address, tokenAmountForInvestor1, {from: investor1})

        try {
           await deal.sendCoin([routerOwner1, routerOwner2], [tokensForSend1, tokensForSend2], 1, {from: investor1})
        } catch (error) {
            assert.equal(await wttoken.balanceOf(routerOwner1), 0)
            assert.equal(await wttoken.balanceOf(routerOwner2), 0)
            assert.equal(error, 'Error: VM Exception while processing transaction: revert')
        }
    })

})