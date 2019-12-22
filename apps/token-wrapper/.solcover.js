module.exports = {
    norpc: true,
    copyPackages: [
      '@aragon/os',
      '@aragon/apps-voting',
      '@aragonone/voting-connectors-contract-utils'
    ],
    skipFiles: [
        'test',
        '@aragon/os',
        '@aragon/apps-voting',
        '@aragonone/voting-connectors-contract-utils',
    ]
}
