import { Role, User } from '@prisma/client';
import { prisma } from '../config/prisma-connect';
import bcrypt from 'bcrypt';
import { IUserLogin } from '../interfaces/login-user';
import { jwtService } from './jwt-services';
import { IJWTPayload } from '../interfaces/jwt-payload';
import { PaginationParameters } from '../interfaces/pagination-parameters';
import { IUsersFilter } from '../interfaces/users-filter';

const userServices = {
  registerOneUser: async (data: User) => {
    const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (!emailExists) {
      const password = await bcrypt.hash(data.password, 10);
      const user = await prisma.user.create({
        data: {
          ...data,
          role: 'User',
          password,
        },
      });
      return user;
    } else {
      throw { code: '_', message: 'Este email já está sendo usado!', statusCode: 422 };
    }
  },

  registerOneUserAuth: async (data: User) => {
    const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (!emailExists) {
      const password = await bcrypt.hash(data.password, 10);
      const user = await prisma.user.create({
        data: {
          ...data,
          password,
        },
      });
      return user;
    } else {
      throw { code: '_', message: 'Este email já está sendo usado!', statusCode: 422 };
    }
  },

  login: async (data: IUserLogin) => {
    const user = await userServices.findOneUser(data.email);
    if (user) {
      const validatePassword = await bcrypt.compare(data.password, user.password);
      if (validatePassword) {
        const { id, first_name, last_name, email, role } = user;
        const payload = { id, first_name, last_name, email, role } as IJWTPayload;
        const token = await jwtService.createToken(payload);
        return { payload, token };
      } else {
        throw { code: '_', message: 'Senha ou email incorretos!', statusCode: 401 };
      }
    } else {
      throw { code: '_', message: 'Cadastre-se para fazer login!', statusCode: 422 };
    }
  },

  findOneUser: async (email: string) => {
    const user = await prisma.user.findFirst({ where: { email } });
    return user;
  },

  findUserById: async (id: number) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        first_name: true,
        last_name: true,
        avatar_url: true,
        phone: true,
        role: true,
      },
    });
    if (user) {
      return user;
    } else {
      throw { code: '_', message: 'Não foi possível encontrar esse usuário!', statusCode: 422 };
    }
  },

  findAllUsers: async (pagination: PaginationParameters, filter: IUsersFilter) => {
    const [users, count] = await Promise.all([
      prisma.user.findMany({
        take: pagination.per_page_number,
        skip: pagination.skip,
        where: {
          first_name: { contains: filter?.first_name },
          last_name: { contains: filter?.last_name },
          email: { contains: filter?.email },
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          email: true,
          phone: true,
          role: true,
          manager_id: true,
        },
      }),
      prisma.user.count({
        where: {
          first_name: { contains: filter?.first_name },
          last_name: { contains: filter?.last_name },
          email: { contains: filter?.email },
        },
      }),
    ]);
    const pages = Math.ceil(count / pagination.per_page_number);
    if (pagination.page_number > pages)
      throw {
        code: '_',
        message: `Não existe a página ${pagination.page_number} de um total de ${pages} páginas!`,
        statusCode: 422,
      };
    return { count, page: pagination.page_number, per_page: pagination.per_page_number, pages, users };
  },

  updateOneUser: async (id: number, attributes: User) => {
    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        first_name: attributes.first_name,
        last_name: attributes.last_name,
        phone: attributes.phone,
      },
    });

    if (user) {
      return { message: 'Informações atualizadas com sucesso!' };
    }
  },
};

export { userServices };
