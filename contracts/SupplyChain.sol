pragma solidity ^0.8.0;

contract SupplyChain {
    // Model a Candidate
    struct Candidate {
        uint id;
        address Account;
        uint chainSeqNo;
        bool isOwner;
    }

    struct transferShipment {
        uint transferId;
        address origin;
        address destination;
        string product;
        uint amount;
        string departureDate;
        string arrivalDate;   
        string description;      
    }

    struct Product {
        uint productId;
        string name;
    }

    address public contractOwner = 0x6E9f1e700bdC288beda0c6002C9ba438830Ad2ad;

    modifier onlyOwner() {
     require(msg.sender == contractOwner, "Only the contract owner can perform this action.");
     _;
    }

    address public transferOwner = 0x6E9f1e700bdC288beda0c6002C9ba438830Ad2ad;

    modifier onlyTransferOwner() {
     require(msg.sender == transferOwner, "Only the transfer owner can perform this action.");
     _;
    }

    // Store accounts that have transfered
    mapping(address => bool) public senders;

    // Store accounts with ownership
    mapping(address => bool) public owners;

    // Store Chain Count
    uint public chainCount = 1;

    // Store Candidates
    mapping(uint => Candidate) public candidates;

    // Store Candidates Count
    uint public candidatesCount;

    // Store Transfer Shipments
    mapping(uint => transferShipment) public transferShipments;

    // Store Transfer Shipment Count
    uint public transferShipmentsCount;

    // Store Products
    mapping(uint => Product) public products;

    uint public productsCount;


   string public productToUpdate;
   uint   public amountToUpdate;
   string public departureToUpdate;
   string public arrivalToUpdate;
   string public descriptionToUpdate;

    function getProductToUpdate() public view returns (string memory) {
        return productToUpdate;
    }
    
    // Helper
    uint public i = 0;

    // transfer event
    event transferedEvent (
        uint indexed _candidateId
    );

    constructor (address[] memory accounts) public {
     contractOwner = address(contractOwner);
     transferOwner = contractOwner;
     addMultipleProducts();
     for (i; i<accounts.length; i++){
       bool isTheOwner = false;
       uint chainNo = 0;
       if(i==0){
        owners[accounts[i]] = true;
        isTheOwner = true;
        chainNo = 1;
       }else{
        owners[accounts[i]] = false;
       }
       addCandidate(accounts[i],isTheOwner,chainNo);
      }
    }


    function setValues(string memory _productToUpdate, uint _amountToUpdate,string memory _departureToUpdate,
        string memory _arrivalToUpdate,string memory _descriptionToUpdate) public {
    require(owners[msg.sender], "Only owners can set the rest values.");
    productToUpdate = _productToUpdate;
    amountToUpdate = _amountToUpdate;
    departureToUpdate = _departureToUpdate;
    arrivalToUpdate = _arrivalToUpdate;
    descriptionToUpdate = _descriptionToUpdate;
    }


    function addProduct(string memory _productName) public onlyOwner{
        productsCount = productsCount + 1;
        products[productsCount] = Product(productsCount, _productName);
    }

    function addCandidate(address _address,bool _isTheOwner,uint _chainNo) public onlyOwner{
        candidatesCount = candidatesCount + 1;
        candidates[candidatesCount] = Candidate(candidatesCount, _address, _chainNo, _isTheOwner);
    }

    function addTransferShipment(address _origin,address _destination,
        string memory _product,uint _amount,string memory _departureDate,string memory _arrivalDate,
        string memory _description) public {
        transferShipmentsCount = transferShipmentsCount + 1;
        transferShipments[transferShipmentsCount] = 
        transferShipment(transferShipmentsCount,_origin,_destination,_product,_amount,_departureDate,_arrivalDate,_description);
    }

    function transfer (uint _candidateId) public onlyTransferOwner  {
        // require that they haven't transfered before
        require(!senders[msg.sender]);
        require(owners[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that sender has transfered
        senders[msg.sender] = true;

        chainCount ++;

        address newOwnerAddress = candidates[_candidateId].Account;
        transferOwner = newOwnerAddress;
        owners[newOwnerAddress] = true;
        owners[msg.sender] = false;

        candidates[_candidateId].chainSeqNo = chainCount;
        candidates[_candidateId].isOwner = true;
        candidates[chainCount-1].isOwner = false;

        string memory product;
        if (bytes(productToUpdate).length == 0) {
         product = transferShipments[transferShipmentsCount].product;
        }else{
         product = productToUpdate;
        }

        uint amount = amountToUpdate;
        string memory departureDate = departureToUpdate;
        string memory arrivalDate = arrivalToUpdate;   
        string memory description = descriptionToUpdate;  

        addTransferShipment(msg.sender,newOwnerAddress,product,amount,departureDate,arrivalDate,description);

        emit transferedEvent(_candidateId);
        }

        function addMultipleProducts() public onlyOwner{
          addProduct("Product 0");  
          addProduct("Product 1");
          addProduct("Product 2");
          addProduct("Product 3");
          addProduct("Product 4");
          addProduct("Product 5");
          addProduct("Product 6");
          addProduct("Product 7");
          addProduct("Product 8");
          addProduct("Product 9");
        }
    
}