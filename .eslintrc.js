module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    // Disable unused variables/imports warnings
    '@typescript-eslint/no-unused-vars': 'off',
    
    // Allow any types temporarily
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Disable warnings for <img> elements
    '@next/next/no-img-element': 'off',
    
    // Disable warnings for useEffect dependencies
    'react-hooks/exhaustive-deps': 'off',
    
    // Disable warnings for unescaped entities
    'react/no-unescaped-entities': 'off',
    
    // Disable warnings for <a> elements
    '@next/next/no-html-link-for-pages': 'off',
  },
};