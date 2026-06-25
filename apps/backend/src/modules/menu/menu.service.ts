import { Injectable } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
  create(createMenuDto: CreateMenuDto) {
    return {
      message: 'This action adds a new menu item',
      data: createMenuDto,
    };
  }

  findAll() {
    return `This action returns all menu`;
  }

  findOne(id: string) {
    return `This action returns a #${id} menu item`;
  }

  update(id: string, updateMenuDto: UpdateMenuDto) {
    return {
      message: `This action updates a #${id} menu item`,
      id,
      data: updateMenuDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} menu item`;
  }
}
