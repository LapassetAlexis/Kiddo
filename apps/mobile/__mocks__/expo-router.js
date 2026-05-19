const router = {
  push:    jest.fn(),
  replace: jest.fn(),
  back:    jest.fn(),
  navigate:jest.fn(),
};

module.exports = {
  router,
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => router),
  Link: 'Link',
  Tabs: { Screen: 'Tabs.Screen' },
  Stack: { Screen: 'Stack.Screen' },
  Redirect: 'Redirect',
};
