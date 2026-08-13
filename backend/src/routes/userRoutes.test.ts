import Fastify, { FastifyInstance } from 'fastify';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { User } from '@prisma/client';

import { userRoutes } from './userRoutes';
import { prisma } from '../lib/prisma';

/*
|--------------------------------------------------------------------------
| MOCK DE PRISMA
|--------------------------------------------------------------------------
| Evitamos conectarnos realmente a PostgreSQL.
| Durante las pruebas simulamos las respuestas de Prisma.
|--------------------------------------------------------------------------
*/

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

/*
|--------------------------------------------------------------------------
| DATOS DE PRUEBA
|--------------------------------------------------------------------------
*/

const usuarioEjemplo: User = {
  id: 1,
  name: 'Miguel Rodríguez',
  email: 'miguel@example.com',
  role: 'user',
  createdAt: new Date('2026-08-07T12:00:00.000Z'),
  updatedAt: new Date('2026-08-07T12:00:00.000Z'),
};

/*
|--------------------------------------------------------------------------
| PRUEBAS
|--------------------------------------------------------------------------
*/

describe('API de Usuarios - /api/users', () => {
  let app: FastifyInstance;

  /*
  |--------------------------------------------------------------------------
  | Se ejecuta antes de cada prueba
  |--------------------------------------------------------------------------
  */

  beforeEach(async () => {
    vi.clearAllMocks();

    app = Fastify({
      logger: false,
    });

    await app.register(userRoutes);

    await app.ready();
  });

  /*
  |--------------------------------------------------------------------------
  | Se ejecuta después de cada prueba
  |--------------------------------------------------------------------------
  */

  afterEach(async () => {
    await app.close();
  });

  /*
  |--------------------------------------------------------------------------
  | 1. GET /api/users
  |--------------------------------------------------------------------------
  */

  it('GET /api/users debe devolver todos los usuarios', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      usuarioEjemplo,
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/users',
    });

    expect(response.statusCode).toBe(200);//cambio intencional

    const body = response.json<User[]>();

    expect(body).toHaveLength(1);

    expect(body[0].id).toBe(1);
    expect(body[0].name).toBe('Miguel Rodríguez');
    expect(body[0].email).toBe('miguel@example.com');

    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      orderBy: {
        id: 'desc',
      },
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 2. GET /api/users/:id
  |--------------------------------------------------------------------------
  */

  it('GET /api/users/:id debe devolver un usuario existente', async () => {
    vi.mocked(
      prisma.user.findUnique
    ).mockResolvedValue(usuarioEjemplo);

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/1',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<User>();

    expect(body.id).toBe(1);
    expect(body.name).toBe('Miguel Rodríguez');

    expect(
      prisma.user.findUnique
    ).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 3. GET con ID inválido
  |--------------------------------------------------------------------------
  */

  it('GET /api/users/:id debe devolver 400 cuando el ID es inválido', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users/abc',
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: 'ID de usuario inválido',
    });

    expect(
      prisma.user.findUnique
    ).not.toHaveBeenCalled();
  });

  /*
  |--------------------------------------------------------------------------
  | 4. GET usuario inexistente
  |--------------------------------------------------------------------------
  */

  it('GET /api/users/:id debe devolver 404 cuando el usuario no existe', async () => {
    vi.mocked(
      prisma.user.findUnique
    ).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/999',
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toEqual({
      message: 'Usuario no encontrado',
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 5. POST sin datos obligatorios
  |--------------------------------------------------------------------------
  */

  it('POST /api/users debe devolver 400 si faltan nombre o email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/users',

      payload: {
        name: '',
        email: '',
      },
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: 'Nombre y Email son requeridos',
    });

    expect(
      prisma.user.create
    ).not.toHaveBeenCalled();
  });

  /*
  |--------------------------------------------------------------------------
  | 6. POST correo duplicado
  |--------------------------------------------------------------------------
  */

  it('POST /api/users debe rechazar un correo ya registrado', async () => {
    vi.mocked(
      prisma.user.findUnique
    ).mockResolvedValue(usuarioEjemplo);

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',

      payload: {
        name: 'Miguel Rodríguez',
        email: 'miguel@example.com',
        role: 'user',
      },
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message:
        'El correo electrónico ya está registrado',
    });

    expect(
      prisma.user.create
    ).not.toHaveBeenCalled();
  });

  /*
  |--------------------------------------------------------------------------
  | 7. POST crear usuario correctamente
  |--------------------------------------------------------------------------
  */

  it('POST /api/users debe crear un usuario correctamente', async () => {
    /*
     * El correo todavía no existe.
     */
    vi.mocked(
      prisma.user.findUnique
    ).mockResolvedValue(null);

    /*
     * Simulamos la creación.
     */
    vi.mocked(
      prisma.user.create
    ).mockResolvedValue(usuarioEjemplo);

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',

      payload: {
        name: 'Miguel Rodríguez',
        email: 'miguel@example.com',
        role: 'user',
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json<User>();

    expect(body.id).toBe(1);
    expect(body.name).toBe('Miguel Rodríguez');
    expect(body.email).toBe('miguel@example.com');
    expect(body.role).toBe('user');

    expect(
      prisma.user.create
    ).toHaveBeenCalledWith({
      data: {
        name: 'Miguel Rodríguez',
        email: 'miguel@example.com',
        role: 'user',
      },
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 8. POST crea usuario con rol por defecto
  |--------------------------------------------------------------------------
  */

  it('POST /api/users debe utilizar role user cuando no se envía un rol', async () => {
    vi.mocked(
      prisma.user.findUnique
    ).mockResolvedValue(null);

    vi.mocked(
      prisma.user.create
    ).mockResolvedValue(usuarioEjemplo);

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',

      payload: {
        name: 'Miguel Rodríguez',
        email: 'miguel@example.com',
      },
    });

    expect(response.statusCode).toBe(201);

    expect(
      prisma.user.create
    ).toHaveBeenCalledWith({
      data: {
        name: 'Miguel Rodríguez',
        email: 'miguel@example.com',
        role: 'user',
      },
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 9. PUT con ID inválido
  |--------------------------------------------------------------------------
  */

  it('PUT /api/users/:id debe devolver 400 cuando el ID es inválido', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/abc',

      payload: {
        name: 'Usuario actualizado',
        email: 'actualizado@example.com',
        role: 'admin',
      },
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: 'ID de usuario inválido',
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 10. PUT usuario inexistente
  |--------------------------------------------------------------------------
  */

  it('PUT /api/users/:id debe devolver 404 cuando el usuario no existe', async () => {
    vi.mocked(
      prisma.user.findUnique
    ).mockResolvedValue(null);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/999',

      payload: {
        name: 'Usuario actualizado',
        email: 'actualizado@example.com',
        role: 'admin',
      },
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toEqual({
      message: 'Usuario no encontrado',
    });

    expect(
      prisma.user.update
    ).not.toHaveBeenCalled();
  });

  /*
  |--------------------------------------------------------------------------
  | 11. PUT actualizar usuario
  |--------------------------------------------------------------------------
  */

  it('PUT /api/users/:id debe actualizar correctamente un usuario', async () => {
    const usuarioActualizado: User = {
      ...usuarioEjemplo,
      name: 'Miguel Actualizado',
      role: 'admin',
    };

    /*
     * Primera consulta:
     * encontramos al usuario por ID.
     */
    vi.mocked(
      prisma.user.findUnique
    ).mockResolvedValue(usuarioEjemplo);

    /*
     * Simulamos actualización.
     */
    vi.mocked(
      prisma.user.update
    ).mockResolvedValue(usuarioActualizado);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/1',

      payload: {
        name: 'Miguel Actualizado',
        email: 'miguel@example.com',
        role: 'admin',
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<User>();

    expect(body.id).toBe(1);
    expect(body.name).toBe('Miguel Actualizado');
    expect(body.role).toBe('admin');

    expect(
      prisma.user.update
    ).toHaveBeenCalledWith({
      where: {
        id: 1,
      },

      data: {
        name: 'Miguel Actualizado',
        email: 'miguel@example.com',
        role: 'admin',
      },
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 12. PUT correo duplicado
  |--------------------------------------------------------------------------
  */

  it('PUT /api/users/:id debe rechazar un nuevo correo que ya esté en uso', async () => {
    const otroUsuario: User = {
      id: 2,
      name: 'Otro Usuario',
      email: 'otro@example.com',
      role: 'user',
      createdAt: new Date(),
        updatedAt: new Date(),
    };

    /*
     * Primera llamada:
     * encuentra usuario por ID.
     *
     * Segunda llamada:
     * encuentra otro usuario con el nuevo email.
     */
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(usuarioEjemplo)
      .mockResolvedValueOnce(otroUsuario);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/1',

      payload: {
        name: 'Miguel Rodríguez',
        email: 'otro@example.com',
        role: 'user',
      },
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message:
        'El nuevo correo electrónico ya está en uso',
    });

    expect(
      prisma.user.update
    ).not.toHaveBeenCalled();
  });

  /*
  |--------------------------------------------------------------------------
  | 13. DELETE ID inválido
  |--------------------------------------------------------------------------
  */

  it('DELETE /api/users/:id debe devolver 400 con un ID inválido', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/users/abc',
    });

    expect(response.statusCode).toBe(400);

    expect(response.json()).toEqual({
      message: 'ID de usuario inválido',
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 14. DELETE usuario inexistente
  |--------------------------------------------------------------------------
  */

  it('DELETE /api/users/:id debe devolver 404 cuando el usuario no existe', async () => {
    vi.mocked(
      prisma.user.findUnique
    ).mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/users/999',
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toEqual({
      message: 'Usuario no encontrado',
    });

    expect(
      prisma.user.delete
    ).not.toHaveBeenCalled();
  });

  /*
  |--------------------------------------------------------------------------
  | 15. DELETE usuario correctamente
  |--------------------------------------------------------------------------
  */

  it('DELETE /api/users/:id debe eliminar correctamente un usuario', async () => {
    vi.mocked(
      prisma.user.findUnique
    ).mockResolvedValue(usuarioEjemplo);

    vi.mocked(
      prisma.user.delete
    ).mockResolvedValue(usuarioEjemplo);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/users/1',
    });

    expect(response.statusCode).toBe(200);//cambio intencional

    expect(response.json()).toEqual({
      message:
        'Usuario eliminado correctamente',
    });

    expect(
      prisma.user.delete
    ).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });
});