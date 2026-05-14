import { migrateProviderConfig } from '../services/migration_service';

describe('SANS: Configuration Migration Accuracy', () => {
  it('should maintain strict schema parity when migrating trip metadata', () => {
    const sourceConfig = { provider: 'Expedia', fields: ['destination', 'date'] };
    const migrated = migrateProviderConfig(sourceConfig, 'Airbnb');
    
    expect(migrated).toMatchObject({
      destination: expect.any(String),
      date: expect.any(Date)
    });
  });
});