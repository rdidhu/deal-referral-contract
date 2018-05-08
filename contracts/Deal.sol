pragma solidity ^0.4.19;

contract ERC20Interface {
    function totalSupply() public constant returns (uint);
    function balanceOf(address tokenOwner) public constant returns (uint balance);
    function allowance(address tokenOwner, address spender) public constant returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}

contract Deal {

    struct Campaign {
        address creator;
        address[] routers;
        uint tokenAmount;
        bool finished;
    }

    address public owner;

    ERC20Interface public token;

    uint public campaignNum;

    mapping (uint => Campaign) public campaigns;


    function Deal(address addr) {
        owner = msg.sender;
        token = ERC20Interface(addr);
    }

    function updateTokenAddress(address newAddr) {
        token = ERC20Interface(newAddr);
    }

    function createCampaign(address creator, address[] _addresses) returns (uint campaignId) {
        campaigns[campaignNum ++] = Campaign(creator, _addresses, 0, false);
    }

    function getCampaignById(uint id) public constant returns (address[]) {
        return  campaigns[id].routers;
    }

    function sendCoin(address creator, uint id, uint[] amount) {
        for (var i = 0; i < amount.length; i++) {
           token.transferFrom(creator, campaigns[id].routers[i], amount[i]); 
        }
        campaigns[id].finished = true;  
    }
}