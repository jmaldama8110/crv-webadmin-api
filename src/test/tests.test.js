const sum = require('./suma');


test('adds 1 + 2 to equal 3', () => {
    expect(sum(2, 2)).toBe(4);
});

test('there is no I in team', () => {
    expect('team').not.toMatch(/I/);
  });
  
  test('but there is a "stop" in Christoph', () => {
    expect('Christoph').toMatch(/stop/);
  });

  const lata1 = {
    sabor: 'toronja',
    onzas: 12,
  };
  const lata2 = {
    sabor: 'toronja',
    onzas: 12,
  };
  
 describe('las latas de La Croix en mi escritorio', () => {
    test('tienen las mismas propiedades', () => {
      expect(lata1).toEqual(lata2);
    });

    test('no son la misma lata', () => {
      expect(lata1).not.toBe(lata2);
    });
});
