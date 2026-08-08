import React, { useEffect, useState } from 'react';

import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Button,
  Flex,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';

import { notifications } from '@mantine/notifications';

import {
  IconAlertCircle,
  IconCheck,
  IconPencil,
  IconRefresh,
  IconTrash,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-react';

/* =========================================================
   INTERFAZ DE USUARIO
   ========================================================= */

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

/* =========================================================
   CONFIGURACIÓN DE API
   ========================================================= */

const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

const API_URL = BASE_URL.endsWith('/api/users')
  ? BASE_URL
  : `${BASE_URL.replace(/\/$/, '')}/api/users`;

/* =========================================================
   FUNCIÓN PARA MANEJO SEGURO DE ERRORES
   ========================================================= */

const getErrorMessage = (
  error: unknown,
  defaultMessage: string
): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage;
};

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export const UserCrud: React.FC = () => {
  /* =======================================================
     ESTADOS
     ======================================================= */

  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     MODALES
     ======================================================= */

  const [modalOpen, setModalOpen] =
    useState<boolean>(false);

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] =
    useState<boolean>(false);

  const [userToDelete, setUserToDelete] =
    useState<User | null>(null);

  /* =======================================================
     FORMULARIO
     ======================================================= */

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
  });

  const [formSubmitting, setFormSubmitting] =
    useState<boolean>(false);

  /* =======================================================
     OBTENER USUARIOS
     ======================================================= */

  const fetchUsers = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(
          'No se pudo obtener la lista de usuarios'
        );
      }

      const data: User[] = await response.json();

      setUsers(data);
    } catch {
      setError(
        `No se pudo conectar con el servidor backend (${BASE_URL}). ` +
          'Asegúrate de tener ejecutándose el backend Fastify y PostgreSQL.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     CARGA INICIAL
     ======================================================= */

  useEffect(() => {
    void fetchUsers();
  }, []);

  /* =======================================================
     ABRIR MODAL CREAR
     ======================================================= */

  const handleOpenCreateModal = (): void => {
    setEditingUser(null);

    setFormData({
      name: '',
      email: '',
      role: 'user',
    });

    setModalOpen(true);
  };

  /* =======================================================
     ABRIR MODAL EDITAR
     ======================================================= */

  const handleOpenEditModal = (
    user: User
  ): void => {
    setEditingUser(user);

    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });

    setModalOpen(true);
  };

  /* =======================================================
     GUARDAR / ACTUALIZAR USUARIO
     ======================================================= */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim()
    ) {
      notifications.show({
        title: 'Error de validación',
        message:
          'El nombre y correo electrónico son requeridos',
        color: 'red',
      });

      return;
    }

    setFormSubmitting(true);

    try {
      const url = editingUser
        ? `${API_URL}/${editingUser.id}`
        : API_URL;

      const method = editingUser
        ? 'PUT'
        : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      /*
       * Intentamos obtener la respuesta JSON.
       * Si el backend no devuelve JSON válido,
       * utilizamos un objeto vacío.
       */
      const responseData: Partial<User> & {
        message?: string;
      } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            'Error al guardar usuario'
        );
      }

      notifications.show({
        title: editingUser
          ? 'Usuario actualizado'
          : 'Usuario creado',

        message: editingUser
          ? `El usuario ${
              responseData.name || formData.name
            } ha sido actualizado correctamente.`
          : `El usuario ${
              responseData.name || formData.name
            } ha sido registrado.`,

        color: 'green',

        icon: <IconCheck size={16} />,
      });

      setModalOpen(false);

      setEditingUser(null);

      setFormData({
        name: '',
        email: '',
        role: 'user',
      });

      await fetchUsers();
    } catch (err: unknown) {
      notifications.show({
        title: 'Error',

        message: getErrorMessage(
          err,
          'Ocurrió un error inesperado'
        ),

        color: 'red',
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  /* =======================================================
     CONFIRMAR ELIMINACIÓN
     ======================================================= */

  const handleDeleteConfirm =
    async (): Promise<void> => {
      if (!userToDelete) {
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/${userToDelete.id}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          const data: {
            message?: string;
          } = await response
            .json()
            .catch(() => ({}));

          throw new Error(
            data.message ||
              'Error al eliminar usuario'
          );
        }

        notifications.show({
          title: 'Usuario eliminado',

          message: `El usuario ${userToDelete.name} fue eliminado con éxito.`,

          color: 'blue',

          icon: <IconCheck size={16} />,
        });

        setDeleteModalOpen(false);

        setUserToDelete(null);

        await fetchUsers();
      } catch (err: unknown) {
        notifications.show({
          title: 'Error',

          message: getErrorMessage(
            err,
            'No se pudo eliminar el usuario'
          ),

          color: 'red',
        });
      }
    };

  /* =======================================================
     BADGE DE ROL
     ======================================================= */

  const getRoleBadge = (
    role: string
  ): React.ReactNode => {
    switch (role.toLowerCase()) {
      case 'admin':
        return (
          <Badge
            color="violet"
            variant="light"
          >
            Administrador
          </Badge>
        );

      case 'editor':
        return (
          <Badge
            color="cyan"
            variant="light"
          >
            Editor
          </Badge>
        );

      default:
        return (
          <Badge
            color="blue"
            variant="light"
          >
            Usuario
          </Badge>
        );
    }
  };

  /* =======================================================
     INICIALES
     ======================================================= */

  const getInitials = (
    name: string
  ): string => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  /* =======================================================
     INTERFAZ
     ======================================================= */

  return (
    <Stack gap="lg">

      {/* ===============================================
          ENCABEZADO
          =============================================== */}

      <Paper
        p="xl"
        className="glass-card"
      >
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap="md"
        >
          <Group>

            <Avatar
              color="indigo"
              radius="md"
              size="lg"
            >
              <IconUsers size={28} />
            </Avatar>

            <div>

              <Title
                order={2}
                style={{
                  color: '#f8fafc',
                }}
              >
                Gestión de Usuarios
              </Title>

              <Text
                size="sm"
                c="dimmed"
              >
                Administra los registros almacenados
                en la base de datos PostgreSQL
              </Text>

            </div>

          </Group>

          <Group>

            <Tooltip label="Recargar datos">

              <ActionIcon
                variant="default"
                size="lg"
                radius="md"
                onClick={() => {
                  void fetchUsers();
                }}
                loading={loading}
              >
                <IconRefresh size={18} />
              </ActionIcon>

            </Tooltip>

            <Button
              leftSection={
                <IconUserPlus size={18} />
              }
              color="indigo"
              radius="md"
              size="md"
              onClick={handleOpenCreateModal}
            >
              Nuevo Usuario
            </Button>

          </Group>

        </Flex>
      </Paper>

      {/* ===============================================
          ERROR DE CONEXIÓN
          =============================================== */}

      {error && (

        <Alert
          icon={
            <IconAlertCircle size={16} />
          }
          title="Error de conexión"
          color="red"
          radius="md"
        >
          {error}
        </Alert>

      )}

      {/* ===============================================
          TABLA DE USUARIOS
          =============================================== */}

      <Paper
        p="md"
        className="glass-card"
      >

        {loading ? (

          <Flex
            justify="center"
            align="center"
            p="xl"
            direction="column"
            gap="sm"
          >

            <Loader
              color="indigo"
              type="dots"
            />

            <Text
              size="sm"
              c="dimmed"
            >
              Cargando usuarios desde PostgreSQL...
            </Text>

          </Flex>

        ) : users.length === 0 ? (

          <Flex
            justify="center"
            align="center"
            p="xl"
            direction="column"
            gap="xs"
          >

            <IconUsers
              size={48}
              color="#64748b"
            />

            <Text
              fw={500}
              size="lg"
              c="dimmed"
            >
              No hay usuarios registrados
            </Text>

            <Text
              size="sm"
              c="dimmed"
            >
              Haz clic en "Nuevo Usuario"
              para agregar el primero.
            </Text>

            <Button
              mt="xs"
              variant="light"
              color="indigo"
              onClick={handleOpenCreateModal}
            >
              Crear Usuario
            </Button>

          </Flex>

        ) : (

          <Table.ScrollContainer
            minWidth={600}
          >

            <Table
              verticalSpacing="sm"
              horizontalSpacing="md"
            >

              <Table.Thead>

                <Table.Tr>

                  <Table.Th
                    style={{
                      color: '#94a3b8',
                    }}
                  >
                    ID
                  </Table.Th>

                  <Table.Th
                    style={{
                      color: '#94a3b8',
                    }}
                  >
                    Usuario
                  </Table.Th>

                  <Table.Th
                    style={{
                      color: '#94a3b8',
                    }}
                  >
                    Email
                  </Table.Th>

                  <Table.Th
                    style={{
                      color: '#94a3b8',
                    }}
                  >
                    Rol
                  </Table.Th>

                  <Table.Th
                    style={{
                      color: '#94a3b8',
                    }}
                  >
                    Fecha de Registro
                  </Table.Th>

                  <Table.Th
                    style={{
                      color: '#94a3b8',
                      textAlign: 'right',
                    }}
                  >
                    Acciones
                  </Table.Th>

                </Table.Tr>

              </Table.Thead>

              <Table.Tbody>

                {users.map((user) => (

                  <Table.Tr
                    key={user.id}
                    className="user-row"
                  >

                    <Table.Td
                      fw={600}
                      style={{
                        color: '#6366f1',
                      }}
                    >
                      #{user.id}
                    </Table.Td>

                    <Table.Td>

                      <Group gap="sm">

                        <Avatar
                          color="indigo"
                          radius="xl"
                          size="sm"
                        >
                          {getInitials(
                            user.name
                          )}
                        </Avatar>

                        <Text
                          size="sm"
                          fw={600}
                          style={{
                            color: '#f1f5f9',
                          }}
                        >
                          {user.name}
                        </Text>

                      </Group>

                    </Table.Td>

                    <Table.Td
                      style={{
                        color: '#cbd5e1',
                      }}
                    >
                      {user.email}
                    </Table.Td>

                    <Table.Td>
                      {getRoleBadge(
                        user.role
                      )}
                    </Table.Td>

                    <Table.Td
                      style={{
                        color: '#94a3b8',
                        fontSize: '0.85rem',
                      }}
                    >

                      {new Date(
                        user.createdAt
                      ).toLocaleDateString(
                        'es-ES',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}

                    </Table.Td>

                    <Table.Td>

                      <Group
                        gap="xs"
                        justify="flex-end"
                      >

                        <Tooltip label="Editar usuario">

                          <ActionIcon
                            variant="subtle"
                            color="indigo"
                            onClick={() =>
                              handleOpenEditModal(
                                user
                              )
                            }
                          >
                            <IconPencil
                              size={18}
                            />
                          </ActionIcon>

                        </Tooltip>

                        <Tooltip label="Eliminar usuario">

                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => {
                              setUserToDelete(
                                user
                              );

                              setDeleteModalOpen(
                                true
                              );
                            }}
                          >
                            <IconTrash
                              size={18}
                            />
                          </ActionIcon>

                        </Tooltip>

                      </Group>

                    </Table.Td>

                  </Table.Tr>

                ))}

              </Table.Tbody>

            </Table>

          </Table.ScrollContainer>

        )}

      </Paper>

      {/* ===============================================
          MODAL CREAR / EDITAR
          =============================================== */}

      <Modal
        opened={modalOpen}
        onClose={() =>
          setModalOpen(false)
        }
        title={
          <Text
            fw={700}
            size="lg"
            style={{
              color: '#f8fafc',
            }}
          >
            {editingUser
              ? 'Editar Usuario'
              : 'Nuevo Usuario'}
          </Text>
        }
        centered
        styles={{
          content: {
            background: '#1e293b',
            color: '#f8fafc',
          },
          header: {
            background: '#1e293b',
          },
        }}
      >

        <form
          onSubmit={handleSubmit}
        >

          <Stack gap="md">

            <TextInput
              label="Nombre Completo"
              placeholder="Ej: María García"
              required
              value={formData.name}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  name:
                    event.currentTarget
                      .value,
                })
              }
            />

            <TextInput
              label="Correo Electrónico"
              placeholder="maria@ejemplo.com"
              type="email"
              required
              value={formData.email}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  email:
                    event.currentTarget
                      .value,
                })
              }
            />

            <Select
              label="Rol"
              data={[
                {
                  value: 'user',
                  label:
                    'Usuario Standard',
                },
                {
                  value: 'editor',
                  label: 'Editor',
                },
                {
                  value: 'admin',
                  label:
                    'Administrador',
                },
              ]}
              value={formData.role}
              onChange={(value) =>
                setFormData({
                  ...formData,
                  role:
                    value || 'user',
                })
              }
            />

            <Group
              justify="flex-end"
              mt="md"
            >

              <Button
                variant="default"
                onClick={() =>
                  setModalOpen(false)
                }
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                color="indigo"
                loading={
                  formSubmitting
                }
              >
                {editingUser
                  ? 'Guardar Cambios'
                  : 'Crear Usuario'}
              </Button>

            </Group>

          </Stack>

        </form>

      </Modal>

      {/* ===============================================
          MODAL ELIMINAR
          =============================================== */}

      <Modal
        opened={deleteModalOpen}
        onClose={() =>
          setDeleteModalOpen(false)
        }
        title={
          <Text
            fw={700}
            size="lg"
            c="red"
          >
            Confirmar eliminación
          </Text>
        }
        centered
        styles={{
          content: {
            background: '#1e293b',
            color: '#f8fafc',
          },
          header: {
            background: '#1e293b',
          },
        }}
      >

        <Stack gap="md">

          <Text size="sm">

            ¿Estás seguro de que
            deseas eliminar al usuario{' '}

            <Text
              span
              fw={700}
              c="indigo"
            >
              {userToDelete?.name}
            </Text>

            ? Esta acción no se puede
            deshacer.

          </Text>

          <Group justify="flex-end">

            <Button
              variant="default"
              onClick={() =>
                setDeleteModalOpen(
                  false
                )
              }
            >
              Cancelar
            </Button>

            <Button
              color="red"
              onClick={() => {
                void handleDeleteConfirm();
              }}
            >
              Eliminar
            </Button>

          </Group>

        </Stack>

      </Modal>

    </Stack>
  );
};