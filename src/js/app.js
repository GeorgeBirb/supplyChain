App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    hasTransfered: false,
    owns: false,
    accountAddresses: [],

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
        App.web3Provider = new Web3.providers.WebsocketProvider('ws://localhost:7545');
        web3 = new Web3(App.web3Provider);
        console.log(web3.version);
        console.log(App.web3Provider);
        // Fetch all accounts from Web3 provider and store them in the accountAddresses array
        web3.eth.getAccounts((error, accounts) => {
            if (error) {
                console.error('Error getting accounts:', error);
            } else {
                // Request account access
                ethereum
                    .request({method: 'eth_requestAccounts'})
                    .then(function (accounts) {
                        App.account = accounts[0];
                        $("#accountAddress").html("Your Account: " + App.account);
                        // Now call the migration script with the updated App.account value
                        App.initContract();
                    })
                    .catch(function (err) {
                        console.error(err);
                    });
            }
        });
    },


    initContract: function () {
        $.getJSON("SupplyChain.json", function (supplyChain) {
            App.contracts.SupplyChain = TruffleContract(supplyChain);
            App.contracts.SupplyChain.setProvider(App.web3Provider);
            App.contracts.SupplyChain.setNetwork("5777");
            App.listenForEvents();
            return App.render();
        });
    },


    listenForEvents: function () {
        App.contracts.SupplyChain.deployed().then(function (instance) {
            // Retrieve the contract event
            var event = instance.transferedEvent();
            event.on("data", function (event) {
                console.log("event triggered", event);
                App.render();
            });

            event.on("error", function (error) {
                console.error("error in event", error);
            });
        }).catch(function (error) {
            console.error("Error with contract deployment", error);
        });
    },

    render: function () {
        var productsData;
        var supplyChainInstance;
        var loader = $("#loader");
        var content = $("#content");

        loader.show();
        content.hide();

        // Request account access
        ethereum
            .request({method: 'eth_requestAccounts'})
            .then(function (accounts) {
                App.account = accounts[0];
                $("#accountAddress").html("Your Account: " + App.account);
            })
            .catch(function (err) {
                console.error(err);
            });

        // Load contract data
    App.contracts.SupplyChain.deployed().then(function (instance) {
        supplyChainInstance = instance;
        return Promise.all([
            supplyChainInstance.candidatesCount(),
            supplyChainInstance.transferShipmentsCount(),
            supplyChainInstance.contractOwner(),
            supplyChainInstance.productsCount()
        ]);
    }).then(function ([candidatesCount, transferShipmentsCount, contractOwner, productsCount]) {

        var productSelect = $('#productSelect');
        productSelect.empty();
        productSelect.append('<option value="">Select a product</option>'); 

        var productsPromises = [];
        for (var i = 1; i <= productsCount; i++) {
            productsPromises.push(supplyChainInstance.products(i));
        }


        Promise.all(productsPromises).then(function (productsDataResult) {
            // Sort products in ascending order based on their names
            productsDataResult.sort((a, b) => a[1].localeCompare(b[1]));

            // Populate the product select menu
            for (var i = 0; i < productsDataResult.length; i++) {
                var product = productsDataResult[i];
                var productId = product[0].toNumber();
                var name = product[1];
                var productOption = "<option value='" + productId + "' >" + name + "</option>";
                productSelect.append(productOption);
            }

            productsData = productsDataResult;
        });

        if (contractOwner.toLowerCase() === App.account.toLowerCase()) {
            $("#productSelect").show();
            $("#productLabel").show();
            $("#insertProductButton").show();
        } else {
            $("#productSelect").hide();
            $("#productLabel").hide();
            $("#insertProductButton").hide();
        }

        var candidatesPromises = [];
        var transferShipmentsPromises = [];

        for (var i = 1; i <= candidatesCount; i++) {
            candidatesPromises.push(supplyChainInstance.candidates(i));
        }

        for (var i = 1; i <= transferShipmentsCount; i++) {
            transferShipmentsPromises.push(supplyChainInstance.transferShipments(i));
        }

        return Promise.all([
            Promise.all(candidatesPromises),
            Promise.all(transferShipmentsPromises),
            supplyChainInstance.senders(App.account),
            supplyChainInstance.owners(App.account)
        ]);
    }).then(function ([candidatesData, transferShipmentsData, hasTransfered, owns, productsCount]) {
        App.hasTransfered = hasTransfered;
        App.owns = owns;

        // Sort candidates array by id in ascending order
        var candidates = candidatesData.map(function (candidate) {
            return {
                id: candidate[0].toNumber(),
                address: candidate[1],
                chainSeqNo: candidate[2].toNumber(),
                isOwner: candidate[3]
            };
        });
        candidates.sort((a, b) => a.id - b.id);

        // Append sorted candidates to the candidatesResults table
        var candidatesResults = $("#candidatesResults");
        var candidatesSelect = $('#candidatesSelect');
        candidatesResults.empty();
        candidatesSelect.empty();

        for (var i = 0; i < candidates.length; i++) {
            var candidate = candidates[i];
            var candidateTemplate =
                "<tr><th>" + candidate.id + "</th><td>"
                + candidate.address + "</td><td>"
                + candidate.chainSeqNo + "</td><td>"
                + candidate.isOwner + "</td></tr>";
            candidatesResults.append(candidateTemplate);
            var candidateOption = "<option value='" + candidate.id + "' >" + candidate.id + "</option>";
            candidatesSelect.append(candidateOption);
        }

        var productNamesMap = {};
        for (var i = 0; i < productsData.length; i++) {
            var product = productsData[i];
            var productId = product[0].toNumber();
            var name = product[1];
            productNamesMap[productId] = name;
        }

        // Sort transfer shipments array by transferId in ascending order
        var transferShipments = transferShipmentsData.map(function (transferShipment) {
            return {
                transferId: transferShipment[0].toNumber(),
                origin: transferShipment[1],
                destination: transferShipment[2],
                product: productNamesMap[transferShipment[3]],
                amount: transferShipment[4].toNumber(),
                departureDate: transferShipment[5],
                arrivalDate: transferShipment[6],
                description: transferShipment[7]
            };
        });
        transferShipments.sort((a, b) => a.transferId - b.transferId);



        // Append sorted transfer shipments to the transferResults table
        var transferResults = $("#transferResults");
        transferResults.empty();
        for (var i = 0; i < transferShipments.length; i++) {
            var transferShipment = transferShipments[i];
            var transferTemplate =
                "<tr><th>" + transferShipment.transferId + "</th><td>"
                + transferShipment.origin + "</td><td>"
                + transferShipment.destination + "</td><td>"
                + transferShipment.product + "</td><td>"
                + transferShipment.amount + "</td><td>"
                + transferShipment.departureDate + "</td><td>"
                + transferShipment.arrivalDate + "</td><td>"
                + transferShipment.description + "</td></tr>";
            transferResults.append(transferTemplate);
        }

            return Promise.all([
                supplyChainInstance.senders(App.account),
                supplyChainInstance.owners(App.account)
            ]);
        }).then(function ([hasTransfered, owns]) {
            App.hasTransfered = hasTransfered;
            App.owns = owns;

            // Do not allow a user to transfer if already transfered or not the owner
            if (App.hasVoted || !App.owns) {
                $('form').hide();
                $("#updateBtn").hide();
            }

            loader.hide();
            content.show();
        }).catch(function (error) {
            console.warn(error);
        });
    },

     addProduct: function (productName) {
        if (!productName) {
            console.error("Please enter a product name.");
            return;
        }

        App.contracts.SupplyChain.deployed().then(function (instance) {
            return instance.addProduct(productName, {from: App.account});
        }).then(function (result) {
            console.log("New product added:", result);
            location.reload();
        }).catch(function (err) {
            console.error(err);
        });
      },



     setValues: function (product, amount, departure, arrival, description) {
        var product = $("#productSelect").val();

        var amount = $("#amountInput").val();
        if (!amount) {
            console.error("Update the amount.");
            return;
        }
        var departure = $("#departureInput").val();
        if (!departure) {
            console.error("Update the departure.");
            return;
        }
        var arrival = $("#arrivalInput").val();
        if (!arrival) {
            console.error("Update the arrival.");
            return;
        }
        var description = $("#descriptionInput").val();
        if (!description) {
            console.error("Update the description.");
            return;
        }

        App.contracts.SupplyChain.deployed().then(function (instance) {
            return instance.setValues(product,amount,departure,arrival, description, {from: App.account});
        }).then(function (result) {
            console.log("Rest Values Set:", result);
            location.reload();
        }).catch(function (err) {
            console.error(err);
        });
    },

    castTransfer: function () {
        var candidateId = $('#candidatesSelect').val();
        if (!candidateId) {
            console.error("Please select a candidate to transfer.");
            return;
        }

        App.contracts.SupplyChain.deployed().then(function (instance) {
            return instance.transfer(candidateId, {from: App.account});
        }).then(function (result) {
            // Wait for transfers to update
            $("#content").hide();
            $("#loader").show();
        }).catch(function (err) {
            console.error(err);
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});