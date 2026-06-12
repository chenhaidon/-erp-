import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { UsersService } from "./users.service.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { UpdateUserDto } from "./dto/update-user.dto.js";
import { AssignRolesDto } from "./dto/assign-roles.dto.js";

@Controller()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("users")
  getUsers(@CurrentUser() user: RequestUser) {
    return this.usersService.getUsers(user);
  }

  @Post("users")
  createUser(@CurrentUser() user: RequestUser, @Body() dto: CreateUserDto) {
    return this.usersService.createUser(user, dto);
  }

  @Patch("users/:id")
  updateUser(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(user, id, dto);
  }

  @Post("users/:id/assign-roles")
  assignRoles(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: AssignRolesDto) {
    return this.usersService.assignRoles(user, id, dto);
  }

  @Post("users/:id/deactivate")
  deactivateUser(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.usersService.deactivateUser(user, id);
  }

  @Get("roles")
  getRoles(@CurrentUser() user: RequestUser) {
    return this.usersService.getRoles(user);
  }
}
