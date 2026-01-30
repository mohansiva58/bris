import { query } from '../config/database';
import { User } from '../types';
import bcrypt from 'bcrypt';

export class UserModel {
    // Find user by email
    static async findByEmail(email: string): Promise<User | null> {
        const result = await query<User>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    }

    // Find user by ID
    static async findById(id: number): Promise<User | null> {
        const result = await query<User>(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    // Create new user
    static async create(data: {
        email: string;
        password: string;
        full_name?: string;
        role?: string;
    }): Promise<User> {
        const passwordHash = await bcrypt.hash(data.password, 10);

        const result = await query<User>(
            `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [data.email, passwordHash, data.full_name, data.role || 'user']
        );

        return result.rows[0];
    }

    // Update user
    static async update(
        id: number,
        data: Partial<Omit<User, 'id' | 'created_at'>>
    ): Promise<User | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        const result = await query<User>(
            `UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
            values
        );

        return result.rows[0] || null;
    }

    // Verify password
    static async verifyPassword(
        user: User,
        password: string
    ): Promise<boolean> {
        return bcrypt.compare(password, user.password_hash);
    }

    // Update last login
    static async updateLastLogin(id: number): Promise<void> {
        await query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [id]
        );
    }

    // Get all users (admin only)
    static async findAll(limit = 100, offset = 0): Promise<User[]> {
        const result = await query<User>(
            `SELECT id, email, full_name, role, status, created_at, last_login
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }

    // Count total users
    static async count(): Promise<number> {
        const result = await query<{ count: string }>(
            'SELECT COUNT(*) as count FROM users'
        );
        return parseInt(result.rows[0].count, 10);
    }

    // Lock/unlock user account
    static async setStatus(
        id: number,
        status: 'active' | 'inactive' | 'locked'
    ): Promise<User | null> {
        const result = await query<User>(
            'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0] || null;
    }
}

export default UserModel;
