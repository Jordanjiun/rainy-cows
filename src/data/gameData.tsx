export const gameUpgrades = {
  harvestCooldownMinutes: 0.5,
  harvestCooldownDecreasePerUpgrade: 1,
  harvestDurationSeconds: 10,
  harvetDurationIncreasePerUpgrade: 10,
};

export const shopItemData = [
  {
    label: 'Upgrade Click',
    description: 'Increases mooney gained from clicking by 1.',
    image: 'upgradeClick',
    upgradeName: 'clickLevel',
    prices: {
      1: 100,
    },
  },
];
