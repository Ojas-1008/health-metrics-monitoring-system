
import mongoose from 'mongoose';
import connectDB from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const runTest = async () => {
    console.log('🧪 Starting Database Configuration Test...');

    // Mock process.exit to prevent script termination on error
    const originalExit = process.exit;
    process.exit = (code) => {
        console.error(`❌ Process exited with code: ${code}`);
        throw new Error(`Process exited with code ${code}`);
    };

    try {
        // Check initial state (should be 0: disconnected)
        console.log(`Initial Connection State: ${mongoose.connection.readyState}`);

        // Attempt connection
        console.log('🔄 Attempting to connect...');
        await connectDB();

        // Verify connection state (should be 1: connected)
        if (mongoose.connection.readyState === 1) {
            console.log('✅ Assertion Passed: Mongoose connection state is 1 (Connected)');
            console.log(`Host: ${mongoose.connection.host}`);
            console.log(`Database: ${mongoose.connection.name}`);
        } else {
            console.error(`❌ Assertion Failed: Mongoose connection state is ${mongoose.connection.readyState}`);
            process.exit(1);
        }

        // Test event listeners (simulate disconnect)
        console.log('🔄 Testing disconnection...');
        await mongoose.connection.close();

        if (mongoose.connection.readyState === 0) {
            console.log('✅ Assertion Passed: Mongoose connection closed successfully');
        } else {
            console.error('❌ Assertion Failed: Mongoose connection did not close properly');
        }

        console.log('🎉 Database Configuration Test Completed Successfully!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        // Restore process.exit
        process.exit = originalExit;
        // Ensure connection is closed
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    }
};

runTest();
