function batchMintInterface() {
  return {
    inputs: [
      {
        internalType: 'address[]',
        name: 'toArray',
        type: 'address[]'
      },
      {
        internalType: 'uint256[]',
        name: 'amountArray',
        type: 'uint256[]'
      }
    ],
    name: 'batchMint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
}

function mintInterface() {
  return {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
}

function tokenProxyAbi() {
  return [{'inputs':[{'internalType':'address','name':'_logic','type':'address'},{'internalType':'address','name':'admin_','type':'address'},{'internalType':'bytes','name':'_data','type':'bytes'}],'stateMutability':'payable','type':'constructor'},{'anonymous':false,'inputs':[{'indexed':false,'internalType':'address','name':'previousAdmin','type':'address'},{'indexed':false,'internalType':'address','name':'newAdmin','type':'address'}],'name':'AdminChanged','type':'event'},{'anonymous':false,'inputs':[{'indexed':true,'internalType':'address','name':'beacon','type':'address'}],'name':'BeaconUpgraded','type':'event'},{'anonymous':false,'inputs':[{'indexed':true,'internalType':'address','name':'implementation','type':'address'}],'name':'Upgraded','type':'event'},{'stateMutability':'payable','type':'fallback'},{'inputs':[],'name':'admin','outputs':[{'internalType':'address','name':'admin_','type':'address'}],'stateMutability':'nonpayable','type':'function'},{'inputs':[{'internalType':'address','name':'newAdmin','type':'address'}],'name':'changeAdmin','outputs':[],'stateMutability':'nonpayable','type':'function'},{'inputs':[],'name':'implementation','outputs':[{'internalType':'address','name':'implementation_','type':'address'}],'stateMutability':'nonpayable','type':'function'},{'inputs':[{'internalType':'address','name':'newImplementation','type':'address'}],'name':'upgradeTo','outputs':[],'stateMutability':'nonpayable','type':'function'},{'inputs':[{'internalType':'address','name':'newImplementation','type':'address'},{'internalType':'bytes','name':'data','type':'bytes'}],'name':'upgradeToAndCall','outputs':[],'stateMutability':'payable','type':'function'},{'stateMutability':'payable','type':'receive'}]
}

function tokenAbi() {
  return [
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': true,
          'internalType': 'address',
          'name': 'owner',
          'type': 'address'
        },
        {
          'indexed': true,
          'internalType': 'address',
          'name': 'spender',
          'type': 'address'
        },
        {
          'indexed': false,
          'internalType': 'uint256',
          'name': 'value',
          'type': 'uint256'
        }
      ],
      'name': 'Approval',
      'type': 'event'
    },
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': true,
          'internalType': 'address',
          'name': 'delegator',
          'type': 'address'
        },
        {
          'indexed': true,
          'internalType': 'address',
          'name': 'fromDelegate',
          'type': 'address'
        },
        {
          'indexed': true,
          'internalType': 'address',
          'name': 'toDelegate',
          'type': 'address'
        }
      ],
      'name': 'DelegateChanged',
      'type': 'event'
    },
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': true,
          'internalType': 'address',
          'name': 'delegate',
          'type': 'address'
        },
        {
          'indexed': false,
          'internalType': 'uint256',
          'name': 'previousBalance',
          'type': 'uint256'
        },
        {
          'indexed': false,
          'internalType': 'uint256',
          'name': 'newBalance',
          'type': 'uint256'
        }
      ],
      'name': 'DelegateVotesChanged',
      'type': 'event'
    },
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': false,
          'internalType': 'uint8',
          'name': 'version',
          'type': 'uint8'
        }
      ],
      'name': 'Initialized',
      'type': 'event'
    },
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': true,
          'internalType': 'address',
          'name': 'previousOwner',
          'type': 'address'
        },
        {
          'indexed': true,
          'internalType': 'address',
          'name': 'newOwner',
          'type': 'address'
        }
      ],
      'name': 'OwnershipTransferred',
      'type': 'event'
    },
    {
      'anonymous': false,
      'inputs': [
        {
          'indexed': true,
          'internalType': 'address',
          'name': 'from',
          'type': 'address'
        },
        {
          'indexed': true,
          'internalType': 'address',
          'name': 'to',
          'type': 'address'
        },
        {
          'indexed': false,
          'internalType': 'uint256',
          'name': 'value',
          'type': 'uint256'
        }
      ],
      'name': 'Transfer',
      'type': 'event'
    },
    {
      'inputs': [],
      'name': 'DOMAIN_SEPARATOR',
      'outputs': [
        {
          'internalType': 'bytes32',
          'name': '',
          'type': 'bytes32'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'owner',
          'type': 'address'
        },
        {
          'internalType': 'address',
          'name': 'spender',
          'type': 'address'
        }
      ],
      'name': 'allowance',
      'outputs': [
        {
          'internalType': 'uint256',
          'name': '',
          'type': 'uint256'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'spender',
          'type': 'address'
        },
        {
          'internalType': 'uint256',
          'name': 'amount',
          'type': 'uint256'
        }
      ],
      'name': 'approve',
      'outputs': [
        {
          'internalType': 'bool',
          'name': '',
          'type': 'bool'
        }
      ],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'account',
          'type': 'address'
        }
      ],
      'name': 'balanceOf',
      'outputs': [
        {
          'internalType': 'uint256',
          'name': '',
          'type': 'uint256'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address[]',
          'name': 'toArray',
          'type': 'address[]'
        },
        {
          'internalType': 'uint256[]',
          'name': 'amountArray',
          'type': 'uint256[]'
        }
      ],
      'name': 'batchMint',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'from',
          'type': 'address'
        },
        {
          'internalType': 'address[]',
          'name': 'toArray',
          'type': 'address[]'
        },
        {
          'internalType': 'uint256[]',
          'name': 'amountArray',
          'type': 'uint256[]'
        }
      ],
      'name': 'batchTransferFrom',
      'outputs': [
        {
          'internalType': 'bool',
          'name': '',
          'type': 'bool'
        }
      ],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'account',
          'type': 'address'
        },
        {
          'internalType': 'uint32',
          'name': 'pos',
          'type': 'uint32'
        }
      ],
      'name': 'checkpoints',
      'outputs': [
        {
          'components': [
            {
              'internalType': 'uint32',
              'name': 'fromBlock',
              'type': 'uint32'
            },
            {
              'internalType': 'uint224',
              'name': 'votes',
              'type': 'uint224'
            }
          ],
          'internalType': 'struct ERC20VotesUpgradeable.Checkpoint',
          'name': '',
          'type': 'tuple'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [],
      'name': 'decimals',
      'outputs': [
        {
          'internalType': 'uint8',
          'name': '',
          'type': 'uint8'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'spender',
          'type': 'address'
        },
        {
          'internalType': 'uint256',
          'name': 'subtractedValue',
          'type': 'uint256'
        }
      ],
      'name': 'decreaseAllowance',
      'outputs': [
        {
          'internalType': 'bool',
          'name': '',
          'type': 'bool'
        }
      ],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'delegatee',
          'type': 'address'
        }
      ],
      'name': 'delegate',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'delegatee',
          'type': 'address'
        },
        {
          'internalType': 'uint256',
          'name': 'nonce',
          'type': 'uint256'
        },
        {
          'internalType': 'uint256',
          'name': 'expiry',
          'type': 'uint256'
        },
        {
          'internalType': 'uint8',
          'name': 'v',
          'type': 'uint8'
        },
        {
          'internalType': 'bytes32',
          'name': 'r',
          'type': 'bytes32'
        },
        {
          'internalType': 'bytes32',
          'name': 's',
          'type': 'bytes32'
        }
      ],
      'name': 'delegateBySig',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'account',
          'type': 'address'
        }
      ],
      'name': 'delegates',
      'outputs': [
        {
          'internalType': 'address',
          'name': '',
          'type': 'address'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'uint256',
          'name': 'blockNumber',
          'type': 'uint256'
        }
      ],
      'name': 'getPastTotalSupply',
      'outputs': [
        {
          'internalType': 'uint256',
          'name': '',
          'type': 'uint256'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'account',
          'type': 'address'
        },
        {
          'internalType': 'uint256',
          'name': 'blockNumber',
          'type': 'uint256'
        }
      ],
      'name': 'getPastVotes',
      'outputs': [
        {
          'internalType': 'uint256',
          'name': '',
          'type': 'uint256'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'account',
          'type': 'address'
        }
      ],
      'name': 'getVotes',
      'outputs': [
        {
          'internalType': 'uint256',
          'name': '',
          'type': 'uint256'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'spender',
          'type': 'address'
        },
        {
          'internalType': 'uint256',
          'name': 'addedValue',
          'type': 'uint256'
        }
      ],
      'name': 'increaseAllowance',
      'outputs': [
        {
          'internalType': 'bool',
          'name': '',
          'type': 'bool'
        }
      ],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'string',
          'name': '_name',
          'type': 'string'
        },
        {
          'internalType': 'string',
          'name': '_symbol',
          'type': 'string'
        }
      ],
      'name': 'initialize',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'to',
          'type': 'address'
        },
        {
          'internalType': 'uint256',
          'name': 'amount',
          'type': 'uint256'
        }
      ],
      'name': 'mint',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'spender',
          'type': 'address'
        },
        {
          'internalType': 'uint256',
          'name': 'amount',
          'type': 'uint256'
        }
      ],
      'name': 'mintAndApprove',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [],
      'name': 'name',
      'outputs': [
        {
          'internalType': 'string',
          'name': '',
          'type': 'string'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'owner',
          'type': 'address'
        }
      ],
      'name': 'nonces',
      'outputs': [
        {
          'internalType': 'uint256',
          'name': '',
          'type': 'uint256'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'account',
          'type': 'address'
        }
      ],
      'name': 'numCheckpoints',
      'outputs': [
        {
          'internalType': 'uint32',
          'name': '',
          'type': 'uint32'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [],
      'name': 'owner',
      'outputs': [
        {
          'internalType': 'address',
          'name': '',
          'type': 'address'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'owner',
          'type': 'address'
        },
        {
          'internalType': 'address',
          'name': 'spender',
          'type': 'address'
        },
        {
          'internalType': 'uint256',
          'name': 'value',
          'type': 'uint256'
        },
        {
          'internalType': 'uint256',
          'name': 'deadline',
          'type': 'uint256'
        },
        {
          'internalType': 'uint8',
          'name': 'v',
          'type': 'uint8'
        },
        {
          'internalType': 'bytes32',
          'name': 'r',
          'type': 'bytes32'
        },
        {
          'internalType': 'bytes32',
          'name': 's',
          'type': 'bytes32'
        }
      ],
      'name': 'permit',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [],
      'name': 'renounceOwnership',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [],
      'name': 'symbol',
      'outputs': [
        {
          'internalType': 'string',
          'name': '',
          'type': 'string'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [],
      'name': 'totalSupply',
      'outputs': [
        {
          'internalType': 'uint256',
          'name': '',
          'type': 'uint256'
        }
      ],
      'stateMutability': 'view',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'to',
          'type': 'address'
        },
        {
          'internalType': 'uint256',
          'name': 'amount',
          'type': 'uint256'
        }
      ],
      'name': 'transfer',
      'outputs': [
        {
          'internalType': 'bool',
          'name': '',
          'type': 'bool'
        }
      ],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'from',
          'type': 'address'
        },
        {
          'internalType': 'address',
          'name': 'to',
          'type': 'address'
        },
        {
          'internalType': 'uint256',
          'name': 'amount',
          'type': 'uint256'
        }
      ],
      'name': 'transferFrom',
      'outputs': [
        {
          'internalType': 'bool',
          'name': '',
          'type': 'bool'
        }
      ],
      'stateMutability': 'nonpayable',
      'type': 'function'
    },
    {
      'inputs': [
        {
          'internalType': 'address',
          'name': 'newOwner',
          'type': 'address'
        }
      ],
      'name': 'transferOwnership',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    }
  ]
}
