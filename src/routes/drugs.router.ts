// ./src/routes/drugs.router.ts
import 'reflect-metadata';
import express, { Request, Response } from 'express';
import { container } from 'tsyringe';
import { DrugsController } from '../controllers/drugs.controller';
import { MemcachedMiddleware } from '../utilities/memcached.utility';

export const drugsRouter = express.Router();
const drugsController = container.resolve(DrugsController);
const memcachedMiddleware = container.resolve(MemcachedMiddleware);

/**
 * GET /drugs
 * Route for searching for a Drug. Provided by a GET all route (that wont actually GET all). Query parameters must be
 * included in order to conduct the search. These query parameters are 'searchQuery' and 'searchType'
 */
drugsRouter.get('/', memcachedMiddleware.useCacheWithDurationOf(2000), async (req: Request, res: Response) => {
  const { searchQuery } = req.query;
  const { searchType } = req.query;

  if (!searchQuery || !searchType) {
    res.status(400).send('Missing parameter searchQuery or searchType');
  }

  try {
    const drugs = await drugsController.findDrug(searchQuery as string, searchType as string);
    res.status(200).send(drugs);
  } catch (error) {
    res.status(404).send(error.message);
  }
});

/**
 * GET drugs/:applicationNumber
 * Route for getting a Drug by FDA Application Number (eg NDA022063, or N022063)
 */
drugsRouter.get('/:applicationNumber', memcachedMiddleware.useCacheWithDurationOf(2000), async (req: Request, res: Response) => {
  const shouldGetSplHistory = (req.query.splHistory === 'true');
  const shouldGetCurrentSplLabel = (req.query.currentSplLabel === 'true');
  const shouldGetDrugImages = (req.query.images === 'true');
  const shouldGetDrugLabels = (req.query.labels === 'true');
  const shouldGerDrugPatents = (req.query.patents === 'true');

  try {
    const drug = await drugsController.getDrugByApplicationNumber(
      req.params.applicationNumber,
      shouldGetSplHistory,
      shouldGetCurrentSplLabel,
      shouldGetDrugImages,
      shouldGetDrugLabels,
      shouldGerDrugPatents,
    );
    res.status(200).send(drug);
  } catch (error) {
    res.status(404).send(error.message);
  }
});
