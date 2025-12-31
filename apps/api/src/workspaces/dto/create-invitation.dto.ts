import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceRole } from 'prisma/client';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'Email address of the person to invite',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Role to assign to the invited member',
    enum: ['ADMIN', 'MEMBER', 'VIEWER'],
    example: 'MEMBER',
  })
  @IsEnum(['ADMIN', 'MEMBER', 'VIEWER'], {
    message: 'Role must be ADMIN, MEMBER, or VIEWER',
  })
  role: WorkspaceRole;
}
