// Almacenamiento simulado para que las pruebas no dependan del dispositivo.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
