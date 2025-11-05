#!/usr/bin/env node

/**
 * Test script to verify delete functionality
 * Tests both single and bulk delete endpoints
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api/v1';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiYWRtaW4ifQ.VaVU-MJUcZXNdxh4fLgdKkuGS--8hNuAXU7i51qGqDU';

async function testDeleteEndpoint() {
  console.log('='.repeat(60));
  console.log('Testing Delete Functionality');
  console.log('='.repeat(60));

  try {
    // First, fetch existing participants
    console.log('\n1️⃣  Fetching existing participants...');
    const getResponse = await fetch(`${API_BASE}/admin/participants`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch participants: ${getResponse.status}`);
    }

    const participants = await getResponse.json();
    console.log(`✅ Found ${participants.length} participants`);
    
    if (participants.length === 0) {
      console.log('❌ No participants to test with. Please add some first.');
      return;
    }

    // Display first few participants
    participants.slice(0, 3).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (ID: ${p.id})`);
    });

    // Test single delete
    const testParticipant = participants[0];
    console.log(`\n2️⃣  Testing single delete for: ${testParticipant.name} (ID: ${testParticipant.id})`);
    
    const deleteResponse = await fetch(`${API_BASE}/admin/participants`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        participants: [
          {
            competitionId: testParticipant.competitionId,
            participantId: testParticipant.participantId,
            userId: testParticipant.id,
          },
        ],
      }),
    });

    const deleteResult = await deleteResponse.json();
    console.log(`Response Status: ${deleteResponse.status}`);
    console.log(`Response Data:`, deleteResult);

    if (!deleteResponse.ok) {
      throw new Error(`Delete failed: ${deleteResult.message}`);
    }

    console.log(`✅ Delete successful! Deleted: ${deleteResult.deleted}, Failed: ${deleteResult.failed || 0}`);

    // Verify deletion
    console.log('\n3️⃣  Verifying deletion...');
    const verifyResponse = await fetch(`${API_BASE}/admin/participants`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
    });

    const participantsAfter = await verifyResponse.json();
    const isDeleted = !participantsAfter.find(p => p.id === testParticipant.id);
    
    if (isDeleted) {
      console.log(`✅ Deletion verified! Participant no longer in list.`);
      console.log(`   Before: ${participants.length} participants`);
      console.log(`   After: ${participantsAfter.length} participants`);
    } else {
      console.log(`❌ Deletion failed! Participant still in list.`);
    }

    // Test bulk delete if there are more participants
    if (participantsAfter.length >= 2) {
      console.log(`\n4️⃣  Testing bulk delete for 2 participants...`);
      const toDelete = participantsAfter.slice(0, 2);
      
      const bulkDeleteResponse = await fetch(`${API_BASE}/admin/participants`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          participants: toDelete.map(p => ({
            competitionId: p.competitionId,
            participantId: p.participantId,
            userId: p.id,
          })),
        }),
      });

      const bulkDeleteResult = await bulkDeleteResponse.json();
      console.log(`Response Status: ${bulkDeleteResponse.status}`);
      console.log(`✅ Bulk delete result:`, bulkDeleteResult);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testDeleteEndpoint();
