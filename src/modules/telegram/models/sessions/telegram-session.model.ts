import { Table, Column, Model, PrimaryKey, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';

interface TelegramSessionAttributes {
  id: string;
  phoneNumber: string;
  sessionData?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TelegramSessionCreationAttributes {
  phoneNumber: string;
  sessionData?: string;
  isActive?: boolean;
}

@Table({ 
  tableName: 'telegram_sessions', 
  timestamps: true 
})
export class TelegramSession extends Model<TelegramSessionAttributes, TelegramSessionCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare phoneNumber: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare sessionData?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  declare isActive: boolean;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare updatedAt: Date;
}