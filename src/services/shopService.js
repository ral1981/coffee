import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'

class ShopService {
  constructor() {
    this.toast = useToast()
  }

  /**
   * Delete a shop and handle associated coffee beans
   * @param {number} shopId - The shop ID to delete
   * @param {string} userId - The user ID (for permission checking)
   * @returns {Promise<Object>} - Success/failure result
   */
  async deleteShop(shopId, userId) {
    try {
      if (!shopId) {
        throw new Error('Shop ID is required')
      }

      if (!userId) {
        throw new Error('User authentication is required')
      }

      console.log(`🗑️ Starting shop deletion process for ID: ${shopId}`)

      // Step 1: Check if shop exists and get shop details
      const { data: shop, error: fetchError } = await supabase
        .from('shops')
        .select('id, name')
        .eq('id', shopId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Shop not found')
        }
        throw fetchError
      }

      // Step 2: Check for associated coffee beans
      const { count: coffeeCount, error: countError } = await supabase
        .from('coffee_beans')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('user_id', userId) // Only count user's own coffees

      if (countError) {
        console.warn('Error counting associated coffees:', countError)
        // Continue anyway - we'll try to delete and let the DB handle constraints
      }

      console.log(`📊 Found ${coffeeCount || 0} associated coffee beans`)

      // Step 3: Prevent deletion if there are associated coffees
      if (coffeeCount && coffeeCount > 0) {
        const message = `Cannot delete "${shop.name}" because it has ${coffeeCount} coffee${coffeeCount === 1 ? '' : 's'} associated with it. Please delete or reassign the coffee entries first.`
        
        this.toast.warning(
          'Cannot Delete Shop', 
          message
        )

        console.log(`❌ Delete prevented - shop has ${coffeeCount} associated coffees`)
        return { 
          success: false, 
          error: message,
          coffeeCount: coffeeCount,
          preventedByAssociations: true,
          deletedShop: shop
        }
      }

      // Step 4: Delete the shop (only if no associated coffees)
      const { error: deleteError } = await supabase
        .from('shops')
        .delete()
        .eq('id', shopId)

      if (deleteError) {
        throw new Error(`Failed to delete shop: ${deleteError.message}`)
      }

      this.toast.success(
        'Shop Deleted', 
        `${shop.name} has been deleted successfully`
      )

      console.log(`✅ Successfully deleted shop: ${shop.name}`)
      return { 
        success: true, 
        deletedShop: shop,
        affectedCoffeeCount: 0
      }

    } catch (err) {
      console.error('❌ ShopService delete error:', err)
      
      let errorMessage = 'Could not delete shop'
      if (err.message.includes('not found')) {
        errorMessage = 'Shop not found'
      } else if (err.message.includes('permission') || err.code === '42501') {
        errorMessage = 'You do not have permission to delete this shop'
      } else if (err.message.includes('network')) {
        errorMessage = 'Please check your connection and try again'
      } else if (err.message.includes('violates foreign key constraint')) {
        errorMessage = 'Cannot delete shop because it has associated coffee entries'
      } else {
        errorMessage = err.message
      }
      
      this.toast.error('Delete Failed', errorMessage)
      return { success: false, error: err.message }
    }
  }

  /**
   * Batch delete multiple shops
   * @param {Array<number>} shopIds - Array of shop IDs to delete
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - Success/failure result with details
   */
  async deleteMultipleShops(shopIds, userId) {
    try {
      const results = []
      let successCount = 0
      let failureCount = 0
      let skippedCount = 0
      let skippedShops = []

      console.log(`🔄 Starting batch delete for ${shopIds.length} shops`)

      for (const shopId of shopIds) {
        const result = await this.deleteShop(shopId, userId)
        results.push({ shopId, ...result })
        
        if (result.success) {
          successCount++
          console.log(`✅ Shop ${shopId} deleted successfully`)
        } else if (result.preventedByAssociations) {
          skippedCount++
          skippedShops.push({
            shopId,
            shopName: result.deletedShop?.name || `Shop ${shopId}`,
            coffeeCount: result.coffeeCount
          })
          console.log(`⏭️ Shop ${shopId} skipped - has ${result.coffeeCount} associated coffees`)
        } else {
          failureCount++
          console.log(`❌ Shop ${shopId} failed to delete: ${result.error}`)
        }
      }

      // Provide detailed feedback based on results
      if (successCount > 0 && failureCount === 0 && skippedCount === 0) {
        // All succeeded
        this.toast.success(
          'Batch Delete Complete', 
          `Successfully deleted all ${successCount} shops`
        )
      } else if (successCount > 0 && (failureCount > 0 || skippedCount > 0)) {
        // Mixed results
        let message = `Deleted ${successCount} shops successfully`
        
        if (skippedCount > 0) {
          message += `, ${skippedCount} skipped (have associated coffees)`
        }
        
        if (failureCount > 0) {
          message += `, ${failureCount} failed`
        }

        this.toast.warning('Batch Delete Partial', message)
        
        // Show details about skipped shops if any
        if (skippedShops.length > 0) {
          const skippedDetails = skippedShops
            .map(shop => `• ${shop.shopName} (${shop.coffeeCount} coffee${shop.coffeeCount === 1 ? '' : 's'})`)
            .join('\n')
          
          console.log('Skipped shops details:', skippedDetails)
        }
        
      } else if (skippedCount > 0 && successCount === 0 && failureCount === 0) {
        // All skipped
        const skippedDetails = skippedShops
          .map(shop => `${shop.shopName} (${shop.coffeeCount} coffee${shop.coffeeCount === 1 ? '' : 's'})`)
          .join(', ')
        
        this.toast.warning(
          'No Shops Deleted', 
          `All ${skippedCount} shops were skipped because they have associated coffees`
        )
      } else if (failureCount > 0 && successCount === 0) {
        // All failed
        this.toast.error(
          'Batch Delete Failed', 
          `Failed to delete any of the ${shopIds.length} shops`
        )
      } else {
        // Edge case
        this.toast.warning(
          'Batch Delete Complete', 
          `Processed ${shopIds.length} shops: ${successCount} deleted, ${skippedCount} skipped, ${failureCount} failed`
        )
      }

      console.log(`📊 Batch delete summary: ${successCount} deleted, ${skippedCount} skipped, ${failureCount} failed`)

      return {
        success: failureCount === 0,
        results,
        successCount,
        failureCount,
        skippedCount,
        skippedShops,
        totalProcessed: shopIds.length
      }

    } catch (err) {
      console.error('❌ Batch delete error:', err)
      this.toast.error('Batch Delete Failed', err.message)
      return { 
        success: false, 
        error: err.message,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
        totalProcessed: shopIds?.length || 0
      }
    }
  }
}

// Create singleton instance
export const shopService = new ShopService()